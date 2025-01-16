# pedidos/views.py

from django.shortcuts import render, get_object_or_404
from django.db.models import Case, When, Value, IntegerField
from django.http import JsonResponse, HttpResponseForbidden
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from autenticacao.models import Perfil 
from django.db.models import Q
from functools import wraps
from .models import Vendedor, Produto, Pedido, PedidoItem
import json
from django.utils import timezone
import logging

# Configuração do logger
logger = logging.getLogger(__name__)

def permission_required(min_level):
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            # Verifica se o usuário está autenticado e possui o nível mínimo
            if not request.user.is_authenticated or request.user.permission_level < min_level:
                return HttpResponseForbidden("Você não tem permissão para acessar esta página.")
            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator

def realiza_pedidos(request):
    numeros = range(1, 18)  # de 1 a 17
    return render(request, 'realiza_pedidos.html', {'numeros': numeros})

@login_required
@permission_required(1)
def producao(request):
    search_query = request.GET.get('q', '').strip()

    # Consulta base com prefetch e anotação para ordenação de status
    pedidos = Pedido.objects.prefetch_related('itens__produto').annotate(
        status_order=Case(
            When(status='Em Produção', then=Value(1)),
            When(status='Pendente', then=Value(2)),
            When(status='Pedido Finalizado', then=Value(3)),
            output_field=IntegerField()
        )
    ).filter(~Q(status='Pedido Finalizado') & ~Q(status='Cancelado'))	

    # Aplica filtros de pesquisa se um termo for fornecido
    if search_query:
        pedidos = pedidos.filter(
            Q(cliente__icontains=search_query) |
            Q(vendedor__nome__icontains=search_query) |
            Q(id__icontains=search_query) |
            Q(vendedor__loja__icontains = search_query)
        )

    # Ordena os resultados conforme status_order e data
    pedidos = pedidos.order_by('status_order', '-data')
    
    return render(request, 'producao/producao.html', {
        'pedidos': pedidos,
        'search_query': search_query  # Passa o termo de busca para o template
    })

#------------------impressao-------------------

@login_required
def imprimir_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    tamanhos = range(15, 44)
    return render(request, 'pedidos/imprimir.html', {
        'pedido': pedido,
        'tamanhos': tamanhos
    })
    
@require_GET
def pedido_itens_api(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    data_local = timezone.localtime(pedido.data)
    
    data = {
        "cliente": pedido.cliente,
        "vendedor_nome": pedido.vendedor.nome,
        "vendedor_codigo": pedido.vendedor.codigo,
        "data": data_local.strftime("%d/%m/%Y"),
        "hora": data_local.strftime("%H:%M"),  
        "status": pedido.status,
        "itens": []
    }
    
    for item in pedido.itens.all():
        data["itens"].append({
            "codigo": item.produto.codigo,
            "nome": item.produto.nome,
            "tamanho": item.tamanho,
            "quantidade": item.quantidade,
            "tipo_servico": item.tipo_servico,
            "sintetico": item.sintetico,
            "cor": item.cor,
            "obs": item.obs,
            "ref_balancinho": item.ref_balancinho,
            "mat_balancinho": item.mat_balancinho,
            "ref_palmilha": item.ref_palmilha,
            "mat_palmilha": item.mat_palmilha,
            "tipo_servico": item.tipo_servico
        })
    return JsonResponse(data)




@require_GET
def buscar_vendedor(request):
    codigo = request.GET.get('codigo', '')
    if not codigo:
        return JsonResponse({'erro': 'Código do vendedor não informado.'}, status=400)

    try:
        vendedor = Vendedor.objects.get(codigo=codigo)
        return JsonResponse({'nome': vendedor.nome})
    except Vendedor.DoesNotExist:
        return JsonResponse({'erro': 'Vendedor não encontrado.'}, status=404)

@require_GET
def buscar_produto(request):
    codigo = request.GET.get('codigo', '')
    if not codigo:
        return JsonResponse({'erro': 'Código não informado.'}, status=400)
    
    # Busque o produto com base em "codigo".
    produto_obj = Produto.objects.filter(codigo=codigo).first()
    if not produto_obj:
        return JsonResponse({'erro': 'Produto não encontrado.'}, status=404)

    return JsonResponse({
        'nome': produto_obj.nome,
        'codigo': produto_obj.codigo
    })

# pedidos/views.py

@require_POST
@login_required
def realizar_pedido(request):
    try:
        body = json.loads(request.body or '{}')

        cliente = body.get('cliente', '').strip()
        codigo_vendedor = body.get('codigoVendedor', '').strip()
        vendedor_nome = body.get('vendedor', '').strip()
        status = body.get('status', 'Pendente').strip()

        # Validações (omitidas para brevidade)...

        # Busca/cria vendedor e cria o pedido
        vendedor, _ = Vendedor.objects.get_or_create(
            codigo=codigo_vendedor,
            defaults={'nome': vendedor_nome}
        )
        pedido = Pedido.objects.create(
            cliente=cliente,
            vendedor=vendedor,
            status=status
        )

        # Percorre os itens
        itens = body.get('itens', [])
        for item in itens:
            refBalancinho = item.get('refBalancinho', '').strip()
            matBalancinho = item.get('matBalancinho', '').strip()
            refPalmilha = item.get('refPalmilha', '').strip()
            matPalmilha = item.get('matPalmilha', '').strip()

            tipoServico = item.get('tipoServico', 'nenhum').strip()
            sintetico = item.get('sintetico', '').strip()
            cor = item.get('cor', '').strip()
            obs = item.get('obs', '').strip()

            # Se quiser, checar refBalancinho ou refPalmilha antes de criar:
            if not refBalancinho and not refPalmilha:
                # Nenhuma referência = item inválido, continue
                continue

            # Você pode escolher usar UMA das refs para criar "produto" principal,
            # ou criar um Produto fictício "Bal/Palm"? Depende da lógica do seu sistema.
            # Exemplo usando refBalancinho como "produto.codigo":
            referencia_principal = refBalancinho or refPalmilha
            nome_produto = matBalancinho or matPalmilha

            produto, _ = Produto.objects.get_or_create(
                codigo=referencia_principal,
                defaults={'nome': nome_produto}
            )

            # Tamanhos
            tamanhos = item.get('tamanhos', {})
            for tamanho, qtd in tamanhos.items():
                if qtd <= 0:
                    continue

                PedidoItem.objects.create(
                    pedido=pedido,
                    produto=produto,
                    quantidade=qtd,
                    tamanho=tamanho,

                    ref_balancinho=refBalancinho,
                    mat_balancinho=matBalancinho,
                    ref_palmilha=refPalmilha,
                    mat_palmilha=matPalmilha,
                    tipo_servico=tipoServico,
                    sintetico=sintetico,
                    cor=cor,
                    obs=obs
                )

        return JsonResponse({'mensagem': 'Pedido criado com sucesso!', 'pedido_id': pedido.pk})

    except json.JSONDecodeError:
        return JsonResponse({'erro': 'JSON inválido.'}, status=400)
    except Exception as e:
        return JsonResponse({'erro': f'Ocorreu um erro: {str(e)}'}, status=500)


@require_POST
@login_required
def realizar_pedido_urgente(request):
    try:
        body = json.loads(request.body or '{}')

        cliente = body.get('cliente', '').strip()
        codigo_vendedor = body.get('codigoVendedor', '').strip()
        vendedor_nome = body.get('vendedor', '').strip()
        status = body.get('status', 'Cliente em espera').strip()

        # Validações básicas
        if not cliente:
            return JsonResponse({'erro': 'Cliente não informado.'}, status=400)
        if not codigo_vendedor or not vendedor_nome:
            return JsonResponse({'erro': 'Dados do vendedor incompletos.'}, status=400)

        vendedor, criado = Vendedor.objects.get_or_create(
            codigo=codigo_vendedor,
            defaults={'nome': vendedor_nome},
        )

        pedido = Pedido.objects.create(
            cliente=cliente,
            vendedor=vendedor,
            status=status,
        )

        itens = body.get('itens', [])
        for item in itens:
            referencia = item.get('referencia', '').strip()
            nome_produto = item.get('material', '').strip()
            # Cuidado aqui: item.get('tamanhos', {}) às vezes vem como tupla?
            tamanhos = item.get('tamanhos', {})
            
            # Campos adicionais
            subpalmilha = item.get('subpalmilha', '').strip()
            costura = item.get('costura', '').strip()
            sintetico = item.get('sintetico', '').strip()
            cor = item.get('cor', '').strip()
            obs = item.get('obs', '').strip()  # Corrija para 'obs', não 'cor'!

            if not referencia:
                continue

            produto, criado_produto = Produto.objects.get_or_create(
                codigo=referencia,
                defaults={'nome': nome_produto},
            )

            # Agora sim criamos o PedidoItem com os novos campos
            for tamanho, qtd in tamanhos.items():
                if not qtd or qtd <= 0:
                    continue

                PedidoItem.objects.create(
                    pedido=pedido,
                    produto=produto,
                    quantidade=qtd,
                    tamanho=tamanho,
                    subpalmilha=subpalmilha,
                    costura=costura,
                    sintetico=sintetico,
                    cor=cor,
                    obs=obs
                )

        return JsonResponse({'mensagem': 'Pedido criado com sucesso!', 'pedido_id': pedido.pk})

    except json.JSONDecodeError:
        return JsonResponse({'erro': 'JSON inválido.'}, status=400)
    except Exception as e:
        return JsonResponse({'erro': f'Ocorreu um erro: {str(e)}'}, status=500)




@csrf_exempt  
@require_POST
@login_required
def cancelar_pedido(request, pedido_id):
    import json
    from django.contrib.auth.models import User
    from django.http import JsonResponse
    from django.shortcuts import get_object_or_404
    from .models import Pedido  # ajuste conforme seu local do modelo Pedido

    body = json.loads(request.body or '{}')
    senha_digitada = body.get('senhaNivel3', '')  # considere renomear a chave se necessário

    pedido = get_object_or_404(Pedido, id=pedido_id)

    # Lista todos os usuários com nível 3 ou 4
    usuarios_autorizados = User.objects.filter(perfil__permission_level__in=[3, 4])

    # Verifica se a senha digitada corresponde à senha de ALGUM usuário nível 3 ou 4
    autorizado = False
    for usuario in usuarios_autorizados:
        if usuario.check_password(senha_digitada):
            autorizado = True
            break

    if not autorizado:
        return JsonResponse({'erro': 'Senha de gerente incorreta ou não encontrada.'}, status=403)

    # Se autorizado, cancela o pedido
    pedido.status = 'Cancelado'
    pedido.save()
    return JsonResponse({'mensagem': f'Pedido {pedido_id} cancelado com sucesso.'})

    

@login_required
def editar_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    tamanhos = list(range(15, 44))
    itens_por_produto = {}
    for item in pedido.itens.all():
        prod = item.produto
        if prod not in itens_por_produto:
            itens_por_produto[prod] = []
        itens_por_produto[prod].append(item)

    if request.method == 'POST':
        try:
            data = json.loads(request.body or '{}')
            # Atualiza informações principais do pedido
            pedido.cliente = data.get('cliente', pedido.cliente)
            # Atualize outros campos do pedido se necessário
            pedido.save()

            # Atualiza itens do pedido
            # Exemplo simplificado: Remove itens antigos e recria com novos dados
            pedido.itens.all().delete()

            for item_data in data.get('itens', []):
                referencia = item_data.get('referencia', '').strip()
                material = item_data.get('material', '').strip()
                tamanhos_quantidades = item_data.get('tamanhos', {})

                if not referencia:
                    logger.warning("Referência do produto não informada.")
                    continue

                # Obter ou criar o produto
                produto, criado = Produto.objects.get_or_create(
                    codigo=referencia,
                    defaults={'nome': material}
                )

                for tamanho, qtd in tamanhos_quantidades.items():
                    try:
                        qtd = int(qtd)
                    except (ValueError, TypeError):
                        continue
                    if qtd <= 0:
                        continue

                    PedidoItem.objects.create(
                        pedido=pedido,
                        produto=produto,
                        quantidade=qtd,
                        tamanho=tamanho
                    )

            return JsonResponse({'mensagem': 'Pedido atualizado com sucesso!'})
        except Exception as e:
            logger.exception("Erro ao atualizar pedido.")
            return JsonResponse({'erro': str(e)}, status=500)

    context = {
        'pedido': pedido,
        'tamanhos': tamanhos,
        'itens_por_produto': itens_por_produto,
    }
    return render(request, 'pedidos/editar_pedido.html', context)

@require_POST
@login_required
@permission_required(2)
def atualizar_status_pedido(request):
    try:
        body = json.loads(request.body or '{}')

        pedido_id = body.get('pedido_id')
        novo_status = body.get('novo_status', '').strip()

        if not pedido_id:
            return JsonResponse({'erro': 'ID do pedido não fornecido.'}, status=400)
        if not novo_status:
            return JsonResponse({'erro': 'Novo status não fornecido.'}, status=400)

        # Verificar se o status é válido
        pedido = get_object_or_404(Pedido, id=pedido_id)
        status_valido = dict(Pedido.STATUS_CHOICES).get(novo_status)
        if not status_valido:
            return JsonResponse({'erro': 'Status inválido.'}, status=400)

        # Atualizar o status
        pedido.status = novo_status
        pedido.save()

        logger.info(f"Pedido #{pedido_id} atualizado para o status '{novo_status}' por {request.user.username}.")

        return JsonResponse({'mensagem': f"Status do pedido atualizado para '{novo_status}'."})

    except json.JSONDecodeError:
        logger.error("JSON inválido na requisição para atualizar status.")
        return JsonResponse({'erro': 'JSON inválido.'}, status=400)
    except Pedido.DoesNotExist:
        logger.error(f"Pedido com ID {pedido_id} não encontrado.")
        return JsonResponse({'erro': 'Pedido não encontrado.'}, status=404)
    except Exception as e:
        logger.exception("Erro ao atualizar o status do pedido.")
        return JsonResponse({'erro': f'Ocorreu um erro: {str(e)}'}, status=500)
    
    
#-------------------------------Finalzados--------------------------------  

@login_required
@permission_required(1)
def pedidos_finalizados(request):
    # Obtém o termo de busca da query string, se fornecido
    search_query = request.GET.get('q', '').strip()

    # Filtra os pedidos com status 'Pedido Finalizado'
    pedidos = Pedido.objects.filter(Q(status='Pedido Finalizado') | Q(status='Cancelado'))
    
    # Se houver termo de busca, filtrar por cliente, vendedor, data ou código
    if search_query:
        pedidos = pedidos.filter(
            Q(cliente__icontains=search_query) |
            Q(vendedor__nome__icontains=search_query) |
            Q(id__icontains=search_query)
        )

    # Pré-carregando itens e ordenando por data decrescente
    pedidos = pedidos.prefetch_related('itens__produto').order_by('-data')
    
    # Renderiza o template passando os pedidos e a query de busca
    return render(request, 'pedidos/pedidos_finalizados.html', {
        'pedidos': pedidos,
        'search_query': search_query
    })