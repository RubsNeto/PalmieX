# pedidos/views.py
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.shortcuts import render, get_object_or_404
from django.db.models import Case, When, Value, IntegerField, Q
from django.http import JsonResponse, HttpResponseForbidden
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST
from django.contrib.auth.models import User
from django.contrib.auth.hashers import check_password
from autenticacao.models import Perfil 
from functools import wraps
import datetime
from .models import Vendedor, Produto, Pedido, PedidoItem, Referencia
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
    return render(request, 'realiza_pedidos.html', {})

def autocomplete_produto(request):
    """
    Retorna uma lista de nomes de produtos que contenham o texto digitado (GET param: q).
    """
    q = request.GET.get('q', '').strip()
    results = []
    if q:
        # Filtra produtos cujo nome contenha 'q'
        produtos = Produto.objects.filter(nome__icontains=q)[:20]
        # Monta lista de nomes para retornar
        results = [p.nome for p in produtos]
    
    return JsonResponse(results, safe=False)


@require_GET
def buscar_produto_por_nome(request):
    """
    Dado um nome de produto, retorna {codigo, nome} em JSON.
    Se não encontrar, retorna erro.
    """
    nome = request.GET.get('nome', '').strip()
    if not nome:
        return JsonResponse({'erro': 'Nome não informado.'}, status=400)
    
    # Procura produto com nome exato (ignorando maiúsc/minúsc, via iexact)
    produto = Produto.objects.filter(nome__iexact=nome).first()
    if not produto:
        return JsonResponse({'erro': 'Produto não encontrado.'}, status=404)
    
    return JsonResponse({
        'codigo': produto.codigo,
        'nome': produto.nome,
    })


@login_required
def producao(request):
    search_query = request.GET.get('q', '').strip()
    data_search = request.GET.get('data', '').strip()  # Parâmetro para data

    # Obtém a área de produção do usuário
    production_area = getattr(request.user, 'perfil', None)
    if production_area:
        production_area = request.user.perfil.production_area
    else:
        production_area = 'solado'

    # Filtra os pedidos de acordo com a área:
    if production_area == "solado":
        # Mostra somente pedidos cujo status do solado não esteja finalizado ou cancelado
        pedidos = Pedido.objects.prefetch_related('itens__produto').filter(
            ~Q(status_solado__in=['Pedido Finalizado', 'Cancelado'])
        )
    elif production_area == "balancinho":
        pedidos = Pedido.objects.prefetch_related('itens__produto').filter(
            ~Q(status_balancinho__in=['Pedido Finalizado', 'Cancelado'])
        )
    else:
        pedidos = Pedido.objects.prefetch_related('itens__produto').filter(
            ~Q(status_balancinho__in=['Pedido Finalizado', 'Cancelado']) and
            ~Q(status_solado__in=['Pedido Finalizado', 'Cancelado'])
        )

    # Filtros adicionais (por texto ou data)
    if search_query:
        pedidos = pedidos.filter(
            Q(cliente__icontains=search_query) |
            Q(vendedor__nome__icontains=search_query) |
            Q(id__icontains=search_query) |
            Q(vendedor__loja__icontains=search_query)
        )

    if data_search:
        try:
            if "-" in data_search:
                date_obj = datetime.datetime.strptime(data_search, '%Y-%m-%d').date()
            elif "/" in data_search:
                date_obj = datetime.datetime.strptime(data_search, '%d/%m/%Y').date()
            else:
                date_obj = None

            if date_obj:
                pedidos = pedidos.filter(data__date=date_obj)
        except ValueError:
            pass

    # Ordena de acordo com a área do usuário
    if production_area == "solado":
        pedidos = pedidos.annotate(
            order_status=Case(
                When(status_solado="Cliente em Espera", then=Value(1)),
                When(status_solado="Em Produção", then=Value(2)),
                When(status_solado="Pendente", then=Value(3)),
                When(status_solado="Pedido Pronto", then=Value(4)),
                When(status_solado="Pedido Finalizado", then=Value(5)),
                When(status_solado="Reposição Pendente", then=Value(6)),
                default=Value(7),
                output_field=IntegerField(),
            )
        ).order_by("order_status", "-data")
    else:  # Visão do balancinho
        pedidos = pedidos.annotate(
            order_status=Case(
                When(status_solado="Cliente em Espera", then=Value(1)),
                When(status_solado="Em Produção", then=Value(2)),
                When(status_solado="Pendente", then=Value(3)),
                When(status_solado="Pedido Pronto", then=Value(4)),
                When(status_solado="Pedido Finalizado", then=Value(5)),
                When(status_solado="Reposição Pendente", then=Value(6)),
                default=Value(7),
                output_field=IntegerField(),
            )
        ).order_by("order_status", "-data")

    page = request.GET.get('page', 1)
    paginator = Paginator(pedidos, 10)
    try:
        pedidos_paginados = paginator.page(page)
    except PageNotAnInteger:
        pedidos_paginados = paginator.page(1)
    except EmptyPage:
        pedidos_paginados = paginator.page(paginator.num_pages)

    return render(request, 'producao/producao.html', {
        'pedidos': pedidos_paginados,
        'search_query': search_query,
        'data_search': data_search,
        'production_area': production_area,
    })




#------------------ Impressão -------------------

@login_required
def imprimir_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    tamanhos = range(15, 44)

    # Obtém a área de produção do usuário logado
    production_area = getattr(request.user, 'perfil', None)
    if production_area:
        production_area = request.user.perfil.production_area
    else:
        production_area = 'solado'  # Valor padrão se não estiver definido

    return render(request, 'pedidos/imprimir.html', {
        'pedido': pedido,
        'tamanhos': tamanhos,
        'production_area': production_area  # Adiciona a área de produção no contexto do template
    })

    
@require_GET
def pedido_itens_api(request, pedido_id):
    try:
        pedido = get_object_or_404(Pedido, id=pedido_id)
        data_local = timezone.localtime(pedido.data)

        logger.debug(f"Recuperando detalhes para o pedido {pedido_id}")

        data = {
            "cliente": pedido.cliente,
            "vendedor_nome": pedido.vendedor.nome,
            "vendedor_codigo": pedido.vendedor.codigo,
            "data": data_local.strftime("%d/%m/%Y"),
            "hora": data_local.strftime("%H:%M"),  
            "status_balancinho": pedido.status_balancinho,
            "motivo_cancelamento": pedido.cancelado,
            "gerente_cancelamento": pedido.gerente_cancelamento.username if pedido.gerente_cancelamento else None,
            "pedido_id": pedido.id,
            "descricao_reposicao": pedido.descricao_reposicao,
            "itens": []
        }

        # Log do gerente
        if pedido.gerente_cancelamento:
            logger.debug(f"Gerente que cancelou: {pedido.gerente_cancelamento.get_full_name()}")
        else:
            logger.debug("Nenhum gerente associado para este cancelamento.")


        for item in pedido.itens.all():
            data["itens"].append({
                "codigo": item.produto.codigo,
                "nome": item.produto.nome,
                "tamanho": item.tamanho,
                "espessura": item.espessura,
                "quantidade": item.quantidade,
                "tipo_servico": item.tipo_servico,
                "sintetico": item.mat_balancinho,
                "marca": item.marca,
                "cor": item.cor,
                "corPalmilha": item.cor_palmilha,
                "obs": item.obs,
                "ref_balancinho": item.ref_balancinho,
                "mat_balancinho": item.mat_balancinho,
                "ref_palmilha": item.ref_palmilha,
                "mat_palmilha": item.mat_palmilha,
            })
        
        return JsonResponse(data)
    
    except Exception as e:
        logger.exception(f"Erro ao recuperar itens do pedido {pedido_id}: {str(e)}")
        return JsonResponse({'erro': f'Erro ao recuperar itens do pedido: {str(e)}'}, status=500)

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

#-------------------- Função para criar pedido --------------------


@require_POST
@login_required
def realizar_pedido(request):
    try:
        body = json.loads(request.body or '{}')

        cliente = body.get('cliente', '').strip()
        codigo_vendedor = body.get('codigoVendedor', '').strip()
        vendedor_nome = body.get('vendedor', '').strip()

        # Recebe os status enviados ou usa os padrões
        status_balancinho = body.get('status_balancinho', 'Pendente').strip()
        status_solado = body.get('status_solado', 'Pendente').strip()

        # Verifica o tipo de pedido enviado
        tipo_pedido = body.get('tipo_pedido', 'ambos').strip()
        if tipo_pedido == 'balancinho':
            # Pedido apenas para balancinho: o status do solado já é finalizado
            status_solado = 'Pedido Finalizado'
        elif tipo_pedido == 'solado':
            # Pedido apenas para solado: o status do balancinho já é finalizado
            status_balancinho = 'Pedido Finalizado'

        # Busca ou cria o vendedor e cria o pedido
        vendedor, _ = Vendedor.objects.get_or_create(
            codigo=codigo_vendedor,
            defaults={'nome': vendedor_nome}
        )
        pedido = Pedido.objects.create(
            cliente=cliente,
            vendedor=vendedor,
            status_balancinho=status_balancinho,
            status_solado=status_solado
        )

        # Percorre os itens do pedido
        itens = body.get('itens', [])
        for item in itens:
            refBalancinho = item.get('refBalancinho', '').strip()
            matBalancinho = item.get('matBalancinho', '').strip()
            refPalmilha   = item.get('refPalmilha', '').strip()
            matPalmilha   = item.get('matPalmilha', '').strip()
            marca         = item.get('marca', 'fibra').strip()
            tipoServico   = item.get('tipoServico', 'Costurado').strip()
            cor           = item.get('cor', '').strip()
            cor_palmilha  = item.get('corPalmilha', '').strip()
            obs           = item.get('obs', '').strip()
            espessura     = item.get('espessura', '').strip()

            # Se não houver nenhuma referência, ignora o item
            if not refBalancinho and not refPalmilha:
                continue

            referencia_principal = refBalancinho or refPalmilha
            nome_produto = matBalancinho or matPalmilha

            produto, _ = Produto.objects.get_or_create(
                codigo=referencia_principal,
                defaults={'nome': nome_produto}
            )

            # Tamanhos (obtidos dos botões quadradinhos)
            tamanhos = item.get('tamanhos', {})
            for tamanho, qtd in tamanhos.items():
                if qtd <= 0:
                    continue

                PedidoItem.objects.create(
                    pedido=pedido,
                    produto=produto,
                    quantidade=qtd,
                    tamanho=tamanho,  # Tamanho do quadradinho
                    marca=marca,
                    ref_balancinho=refBalancinho,
                    mat_balancinho=matBalancinho,
                    ref_palmilha=refPalmilha,
                    mat_palmilha=matPalmilha,
                    tipo_servico=tipoServico,
                    cor=cor,
                    cor_palmilha=cor_palmilha,
                    obs=obs,
                    espessura=espessura
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
        # Para pedidos urgentes, se preferir, você pode definir um status padrão específico.
        status_balancinho = body.get('status_balancinho', 'Cliente em Espera').strip()
        status_solado = body.get('status_solado', 'Cliente em Espera').strip()

        # Validações (omitidas para brevidade)...

        vendedor, _ = Vendedor.objects.get_or_create(
            codigo=codigo_vendedor,
            defaults={'nome': vendedor_nome}
        )
        pedido = Pedido.objects.create(
            cliente=cliente,
            vendedor=vendedor,
            status_balancinho=status_balancinho,
            status_solado=status_solado
        )

        itens = body.get('itens', [])
        for item in itens:
            refBalancinho = item.get('refBalancinho', '').strip()
            matBalancinho = item.get('matBalancinho', '').strip()
            refPalmilha   = item.get('refPalmilha', '').strip()
            matPalmilha   = item.get('matPalmilha', '').strip()
            marca         = item.get('marca', 'Fibra').strip()
            tipoServico   = item.get('tipoServico', 'nenhum').strip()
            cor           = item.get('cor', '').strip()
            cor_palmilha  = item.get('corPalmilha', '').strip()
            obs           = item.get('obs', '').strip()
            tamPalmilha   = item.get('tamPalmilha', '').strip()

            if not refBalancinho and not refPalmilha:
                continue

            referencia_principal = refBalancinho or refPalmilha
            nome_produto = matBalancinho or matPalmilha

            produto, _ = Produto.objects.get_or_create(
                codigo=referencia_principal,
                defaults={'nome': nome_produto}
            )

            tamanhos = item.get('tamanhos', {})
            for tamanho, qtd in tamanhos.items():
                if qtd <= 0:
                    continue

                PedidoItem.objects.create(
                    pedido=pedido,
                    produto=produto,
                    quantidade=qtd,
                    tamanho=tamanho,
                    marca=marca,
                    ref_balancinho=refBalancinho,
                    mat_balancinho=matBalancinho,
                    ref_palmilha=refPalmilha,
                    mat_palmilha=matPalmilha,
                    tipo_servico=tipoServico,
                    cor=cor,
                    cor_palmilha=cor_palmilha,
                    obs=obs,
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
    try:
        body = json.loads(request.body or '{}')
        senha_digitada = body.get('senhaNivel3', '').strip()
        motivo_cancelamento = body.get('motivoCancelamento', '').strip()
        
        # Validações...
        if not senha_digitada or not motivo_cancelamento:
            return JsonResponse({'erro': 'Senha e motivo do cancelamento são obrigatórios.'}, status=400)
        
        pedido = get_object_or_404(Pedido, id=pedido_id)

        # Buscar usuários autorizados (nível 3 ou 4)
        usuarios_autorizados = User.objects.filter(
            perfil__permission_level__in=[3, 4]
        )

        gerente_autorizador = None
        for usuario in usuarios_autorizados:
            if check_password(senha_digitada, usuario.password):
                gerente_autorizador = usuario
                break

        if not gerente_autorizador:
            return JsonResponse({'erro': 'Senha de gerente incorreta ou não encontrada.'}, status=403)

        # Cancelar o pedido e registrar a data de finalização
        pedido.status_balancinho = 'Cancelado'
        pedido.status_solado = 'Cancelado'
        pedido.cancelado = motivo_cancelamento
        pedido.gerente_cancelamento = gerente_autorizador
        pedido.data_finalizado = timezone.now()  # Registra a data/hora atual
        pedido.save()
        
        return JsonResponse({
            'mensagem': f'Pedido {pedido_id} cancelado com sucesso.',
            'gerente': gerente_autorizador.get_full_name()
        })
        
    except Exception as e:
        return JsonResponse({'erro': f'Erro ao cancelar pedido: {str(e)}'}, status=500)
   

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

        pedido = get_object_or_404(Pedido, id=pedido_id)

        user_area = getattr(request.user, 'perfil', None)
        if user_area:
            user_area = request.user.perfil.production_area
        else:
            return JsonResponse({'erro': 'Área de produção não definida para o usuário.'}, status=400)

        if user_area == 'solado':
            pedido.status_solado = novo_status
        elif user_area == 'balancinho':
            pedido.status_balancinho = novo_status
        else:
            return JsonResponse({'erro': 'Área de produção desconhecida.'}, status=400)

        # Se for Reposição Pendente, captura a descrição enviada
        if novo_status == "Reposição Pendente":
            descricao = body.get('descricao_reposicao', '').strip()
            pedido.descricao_reposicao = descricao

            print(f"Pedido {pedido_id} em reposição pendente: {descricao} total: {pedido.descricao_reposicao}")

        if novo_status in ['Pedido Finalizado', 'Cancelado']:
            pedido.data_finalizado = timezone.now()

        pedido.save()

        return JsonResponse({
            'mensagem': f"Status do pedido atualizado para '{novo_status}' na área '{user_area}'."
        })

    except json.JSONDecodeError:
        return JsonResponse({'erro': 'JSON inválido.'}, status=400)
    except Pedido.DoesNotExist:
        return JsonResponse({'erro': 'Pedido não encontrado.'}, status=404)
    except Exception as e:
        return JsonResponse({'erro': f'Ocorreu um erro: {str(e)}'}, status=500)


    
#------------------------------- Finalizados --------------------------------  


@login_required
def pedidos_finalizados(request):
    search_query = request.GET.get('q', '').strip()
    data_search = request.GET.get('data', '').strip()  # Formato ISO: YYYY-MM-DD

    # Obtém a área de produção do usuário
    production_area = getattr(request.user, 'perfil', None)
    if production_area:
        production_area = request.user.perfil.production_area
    else:
        production_area = 'solado'  # Define um valor padrão caso o perfil não esteja definido

    # Filtra os pedidos em que ambos os status são "Pedido Finalizado" ou "Cancelado"
    pedidos = Pedido.objects.select_related('gerente_cancelamento').filter(
        Q(status_balancinho__in=['Pedido Finalizado', 'Cancelado']),
        Q(status_solado__in=['Pedido Finalizado', 'Cancelado'])
    )

    # Filtro de busca textual
    if search_query:
        pedidos = pedidos.filter(
            Q(cliente__icontains=search_query) |
            Q(vendedor__nome__icontains=search_query) |
            Q(id__icontains=search_query) |
            Q(gerente_cancelamento__first_name__icontains=search_query) |
            Q(gerente_cancelamento__last_name__icontains=search_query) |
            Q(cancelado__icontains=search_query)
        )

    # Filtro por data usando o formato ISO (YYYY-MM-DD)
    if data_search:
        try:
            date_obj = datetime.datetime.strptime(data_search, '%Y-%m-%d').date()
            pedidos = pedidos.filter(data__date=date_obj)
        except ValueError:
            pass

    pedidos = pedidos.order_by('-data')

    page = request.GET.get('page', 1)
    paginator = Paginator(pedidos, 10)

    try:
        pedidos_paginados = paginator.page(page)
    except PageNotAnInteger:
        pedidos_paginados = paginator.page(1)
    except EmptyPage:
        pedidos_paginados = paginator.page(paginator.num_pages)
        
        
    for pedido in pedidos_paginados:
        if pedido.data_finalizado:
            pedido.data_finalizado_formatado = pedido.data_finalizado.strftime("%H:%M %d/%m/%Y")
        else:
            pedido.data_finalizado_formatado = ""

    return render(request, 'pedidos/pedidos_finalizados.html', {
        'pedidos': pedidos_paginados,
        'search_query': search_query,
        'data_search': data_search,
        'production_area': production_area,  # Adicionando a variável para o template
    })




@require_GET
def autocomplete_referencia(request):
    """
    Retorna uma lista de referências que começam com a string digitada pelo usuário.
    """
    query = request.GET.get('q', '').strip()
    if not query:
        return JsonResponse([], safe=False)

    referencias = Produto.objects.filter(codigo__icontains=query).values_list('codigo', flat=True)[:10]
    return JsonResponse(list(referencias), safe=False)

@require_GET
def buscar_material_por_referencia(request):
    """
    Retorna o material correspondente à referência informada.
    """
    codigo = request.GET.get('codigo', '').strip()
    if not codigo:
        return JsonResponse({'erro': 'Código não informado'}, status=400)

    produto = get_object_or_404(Produto, codigo=codigo)
    return JsonResponse({'codigo': produto.codigo, 'nome': produto.nome})