# vendedor/views.py

from django.shortcuts import render, get_object_or_404, redirect
from django.contrib import messages  # Importar mensagens para feedback ao usuário
from django.http import JsonResponse
from .models import Vendedor
from .forms import VendedorForm
from django.contrib.auth.decorators import login_required
from functools import wraps
from django.http import JsonResponse, HttpResponseForbidden


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

@permission_required(4)
def lista_vendedores(request):
    # Ordena os vendedores pelo campo 'codigo' de forma crescente
    vendedores = Vendedor.objects.all().order_by('codigo')
    return render(request, 'vendedor/lista_vendedores.html', {'vendedores': vendedores})

@permission_required(4)
def criar_vendedor(request):
    if request.method == 'POST':
        form = VendedorForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('vendedor:lista_vendedores')
    else:
        form = VendedorForm()
    return render(request, 'vendedor/form_vendedor.html', {'form': form})

@permission_required(4)
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

@permission_required(4)
def deletar_vendedor(request, pk):
    if request.method == 'POST':
        vendedor = get_object_or_404(Vendedor, pk=pk)
        vendedor.delete()
        return redirect('vendedor:lista_vendedores')
    else:
        return redirect('vendedor:lista_vendedores')
