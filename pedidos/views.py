from django.shortcuts import render, redirect
from django.http import JsonResponse
from .models import Vendedor, Material, Pedido, PedidoItem
from .forms import VendedorForm, MaterialForm, PedidoForm, PedidoItemForm
from django.contrib.auth.decorators import login_required


@login_required
def realiza_pedidos(request):
    numeros = range(1, 18)  # de 1 a 17
    return render(request, 'realiza_pedidos.html', {'numeros': numeros})


# View para cadastrar vendedores
def cadastrar_vendedor(request):
    if request.method == 'POST':
        form = VendedorForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('listar_vendedores')
    else:
        form = VendedorForm()
    return render(request, 'pedidos/cadastrar_vendedor.html', {'form': form})

# View para cadastrar materiais
def cadastrar_material(request):
    if request.method == 'POST':
        form = MaterialForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('listar_materials')
    else:
        form = MaterialForm()
    return render(request, 'pedidos/cadastrar_material.html', {'form': form})

# View para cadastrar pedidos
def cadastrar_pedido(request):
    if request.method == 'POST':
        form = PedidoForm(request.POST)
        if form.is_valid():
            pedido = form.save()
            # Aqui você pode processar o pedido e os itens
            return redirect('listar_pedidos')
    else:
        form = PedidoForm()
    return render(request, 'pedidos/cadastrar_pedido.html', {'form': form})

# View para adicionar itens no pedido
def adicionar_item_pedido(request, pedido_id):
    pedido = Pedido.objects.get(id=pedido_id)
    if request.method == 'POST':
        form = PedidoItemForm(request.POST)
        if form.is_valid():
            item = form.save(commit=False)
            item.pedido = pedido
            item.save()
            return redirect('visualizar_pedido', pedido_id=pedido.id)
    else:
        form = PedidoItemForm()
    return render(request, 'pedidos/adicionar_item_pedido.html', {'form': form, 'pedido': pedido})

# Buscar vendedor pelo código
def buscar_vendedor(request):
    codigo = request.GET.get('codigo', '')
    try:
        vendedor = Vendedor.objects.get(codigo=codigo)
        return JsonResponse({'nome': vendedor.nome})
    except Vendedor.DoesNotExist:
        return JsonResponse({'erro': 'Vendedor não encontrado'})

# Buscar material pelo código
def buscar_material(request):
    referencia = request.GET.get('referencia', '')
    try:
        material = Material.objects.get(nome=referencia)
        return JsonResponse({'tamanho': material.tamanho_pe})
    except Material.DoesNotExist:
        return JsonResponse({'erro': 'Material não encontrado'})


def listar_vendedores(request):
    vendedores = Vendedor.objects.all()
    return render(request, 'pedidos/listar_vendedores.html', {'vendedores': vendedores})



