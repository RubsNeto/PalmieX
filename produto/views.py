# produto/views.py

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages
from django.http import JsonResponse
from .models import Produto
from .forms import ProdutoForm

def lista_produtos(request):
    produtos = Produto.objects.all().order_by('nome')
    return render(request, 'produto/lista_produtos.html', {'produtos': produtos})

def criar_produto(request):
    if request.method == 'POST':
        form = ProdutoForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Produto criado com sucesso!')
            return redirect('produto:lista_produtos')
    else:
        form = ProdutoForm()
    return render(request, 'produto/form_produto.html', {'form': form})

def editar_produto(request, pk):
    produto = get_object_or_404(Produto, pk=pk)
    if request.method == 'POST':
        form = ProdutoForm(request.POST, instance=produto)
        if form.is_valid():
            form.save()
            messages.success(request, 'Produto atualizado com sucesso!')
            return redirect('produto:lista_produtos')
    else:
        form = ProdutoForm(instance=produto)
    return render(request, 'produto/form_produto.html', {'form': form})

def deletar_produto(request, pk):
    if request.method == 'POST':
        produto = get_object_or_404(Produto, pk=pk)
        produto.delete()
        return JsonResponse({'success': True})
    else:
        return JsonResponse({'success': False, 'error': 'Método não permitido.'}, status=405)
