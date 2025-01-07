# autenticacao/views.py

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from pedidos import views
from django.contrib.auth.decorators import login_required

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')  # Campo padrão
        password = request.POST.get('password')    # Campo padrão
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('pedidos:realiza_pedidos')  # Redireciona para 'realiza_pedidos' após o login
        else:
            messages.error(request, 'Usuário ou senha inválidos.')
    return render(request, 'registration/login.html')  # Renderiza o template de login

def logout_view(request):
    logout(request)
    return redirect('login')  # Redireciona para a página de login após logout

@login_required
def home_view(request):
    return render(request, 'realiza_pedidos.html')
