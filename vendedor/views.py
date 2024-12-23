# vendedor/views.py

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages  # Importar mensagens para feedback ao usuário
from django.http import JsonResponse
from .models import Vendedor
from .forms import VendedorForm

def lista_vendedores(request):
    # Ordena os vendedores pelo campo 'codigo' de forma crescente
    vendedores = Vendedor.objects.all().order_by('codigo')
    return render(request, 'vendedor/lista_vendedores.html', {'vendedores': vendedores})

def criar_vendedor(request):
    if request.method == 'POST':
        form = VendedorForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('vendedor:lista_vendedores')
    else:
        form = VendedorForm()
    return render(request, 'vendedor/form_vendedor.html', {'form': form})

def editar_vendedor(request, pk):
    vendedor = get_object_or_404(Vendedor, pk=pk)
    if request.method == 'POST':
        form = VendedorForm(request.POST, instance=vendedor)
        if form.is_valid():
            form.save()
            return redirect('vendedor:lista_vendedores')  # Redireciona para a lista de vendedores
    else:
        form = VendedorForm(instance=vendedor)
    return render(request, 'vendedor/form_vendedor.html', {'form': form})

def deletar_vendedor(request, pk):
    if request.method == 'POST':
        vendedor = get_object_or_404(Vendedor, pk=pk)
        vendedor.delete()
        return redirect('vendedor:lista_vendedores')
    else:
        return redirect('vendedor:lista_vendedores')
