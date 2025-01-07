# pedidos/views.py

from django.shortcuts import render, get_object_or_404
from django.db.models import Case, When, Value, IntegerField
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_GET, require_POST
from .models import Vendedor, Produto, Pedido, PedidoItem
import json
from django.utils import timezone
import logging

# Configuração do logger
logger = logging.getLogger(__name__)

@login_required
def realiza_pedidos(request):
    numeros = range(1, 18)  # de 1 a 17
    return render(request, 'realiza_pedidos.html', {'numeros': numeros})

@login_required
def producao(request):
    pedidos = Pedido.objects.prefetch_related('itens__produto').annotate(
        status_order=Case(
            When(status='Em Produção', then=Value(1)),
            When(status='Pendente', then=Value(2)),
            When(status='Pedido Finalizado', then=Value(3)),
            output_field=IntegerField()
        )
    ).order_by('status_order', '-data')
    
    return render(request, 'producao/producao.html', {'pedidos': pedidos})




#------------------impressao-------------------

@login_required
def imprimir_pedido(request, pedido_id):
    pedido = get_object_or_404(Pedido, id=pedido_id)
    return render(request, 'pedidos/imprimir.html', {'pedido': pedido})




@require_GET
@login_required
def pedido_itens_api(request, pedido_id):
    """
    Retorna, em formato JSON, os dados de um Pedido específico:
      - cliente
      - vendedor_nome
      - vendedor_codigo
      - data
      - hora
      - status
      - itens (lista de {codigo, nome, tamanho, quantidade})
    """
    pedido = get_object_or_404(Pedido, id=pedido_id)
    
    # Converter para o fuso horário local
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
            "quantidade": item.quantidade
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

@require_POST
@login_required
def realizar_pedido(request):
    try:
        body = json.loads(request.body or '{}')

        cliente = body.get('cliente', '').strip()
        codigo_vendedor = body.get('codigoVendedor', '').strip()
        vendedor_nome = body.get('vendedor', '').strip()
        status = body.get('status', 'Pendente').strip()  # Recebe status do request ou usa padrão

        logger.debug(f"Dados recebidos: Cliente={cliente}, Código Vendedor={codigo_vendedor}, Vendedor={vendedor_nome}, Status={status}")

        # Validações básicas
        if not cliente:
            logger.warning("Cliente não informado.")
            return JsonResponse({'erro': 'Cliente não informado.'}, status=400)
        if not codigo_vendedor or not vendedor_nome:
            logger.warning("Dados do vendedor incompletos.")
            return JsonResponse({'erro': 'Dados do vendedor incompletos.'}, status=400)

        # Busca ou cria o vendedor
        vendedor, criado = Vendedor.objects.get_or_create(
            codigo=codigo_vendedor,
            defaults={'nome': vendedor_nome}
        )
        if criado:
            logger.info(f"Vendedor criado: {vendedor}")

        # Cria o pedido com o status especificado
        pedido = Pedido.objects.create(
            cliente=cliente,
            vendedor=vendedor,
            status=status  # Define o status
        )
        logger.info(f"Pedido criado: {pedido}")

        itens = body.get('itens', [])
        for item in itens:
            referencia = item.get('referencia', '').strip()
            nome_produto = item.get('material', '').strip()
            tamanhos = item.get('tamanhos', {})

            if not referencia:
                logger.warning("Referência do produto não informada.")
                continue

            for tamanho, qtd in tamanhos.items():
                if not qtd or qtd <= 0:
                    logger.warning(f"Quantidade inválida para tamanho {tamanho}.")
                    continue

                produto, criado_produto = Produto.objects.get_or_create(
                    codigo=referencia,
                    defaults={'nome': nome_produto}
                )
                if criado_produto:
                    logger.info(f"Produto criado: {produto}")

                PedidoItem.objects.create(
                    pedido=pedido,
                    produto=produto,
                    quantidade=qtd,
                    tamanho=tamanho
                )
                logger.info(f"PedidoItem criado: {Produto} - Quantidade={qtd}, Tamanho={tamanho}")

        return JsonResponse({'mensagem': 'Pedido criado com sucesso!', 'pedido_id': pedido.pk})

    except json.JSONDecodeError:
        logger.error("JSON inválido.")
        return JsonResponse({'erro': 'JSON inválido.'}, status=400)
    except Exception as e:
        logger.exception("Erro ao realizar pedido.")
        return JsonResponse({'erro': f'Ocorreu um erro: {str(e)}'}, status=500)

@require_POST
@login_required
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