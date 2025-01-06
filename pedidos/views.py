from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Vendedor, Produto, Pedido, PedidoItem
from django.contrib.auth.decorators import login_required


@login_required
def realiza_pedidos(request):
    numeros = range(1, 18)  # de 1 a 17
    return render(request, 'realiza_pedidos.html', {'numeros': numeros})


@login_required
def producao(request):
    object_list = Pedido.objects.all()
    return render(request, 'producao/producao.html')





#---------------------------------Vendedor---------------------------------

import json
from django.http import JsonResponse
from django.views.decorators.http import require_GET, require_POST
from django.shortcuts import get_object_or_404

from .models import Vendedor, Produto, Pedido, PedidoItem

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
    # Se no modelo o campo é "referencia",
    # mas você está querendo filtrar pelo valor digitado,
    # faça:
    produto_obj = Produto.objects.filter(codigo=codigo).first()
    if not produto_obj:
        return JsonResponse({'erro': 'Produto não encontrado.'}, status=404)

    return JsonResponse({
        'nome': produto_obj.nome,
        'codigo': produto_obj.codigo
    })


import json
from django.http import JsonResponse
from .models import Vendedor, Produto, Pedido, PedidoItem

def realizar_pedido(request):
    if request.method != 'POST':
        return JsonResponse({'erro': 'Método inválido (use POST)'}, status=405)
    
    body = json.loads(request.body or '{}')

    cliente = body.get('cliente', '').strip()
    codigo_vendedor = body.get('codigoVendedor', '').strip()
    vendedor_nome = body.get('vendedor', '').strip()
    
    # Busca ou cria o vendedor
    vendedor, _ = Vendedor.objects.get_or_create(
        codigo=codigo_vendedor,
        defaults={'nome': vendedor_nome}
    )

    # Cria o pedido
    pedido = Pedido.objects.create(
        cliente=cliente,
        vendedor=vendedor
    )

    itens = body.get('itens', [])
    for item in itens:
        referencia = item.get('referencia', '').strip()
        nome_produto = item.get('material', '').strip()
        tamanhos = item.get('tamanhos', {})

        if not referencia:
            continue
        
        for tamanho, qtd in tamanhos.items():
            if not qtd or qtd <= 0:
                continue
            
            produto, _ = Produto.objects.get_or_create(
                codigo=referencia,
                defaults={'nome': nome_produto}
            )
            PedidoItem.objects.create(
                pedido=pedido,
                Produto=produto,
                quantidade=qtd,
                tamanho=tamanho
            )
    
    return JsonResponse({'mensagem': 'Pedido criado com sucesso!', 'pedido_id': pedido.pk})
