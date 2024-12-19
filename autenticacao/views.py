from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.forms import UserCreationForm
from django.contrib import messages

# View para login personalizado
def user_login(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            messages.success(request, "Login bem-sucedido!")
            return redirect('home')  # Página inicial ou a página desejada após login
        else:
            messages.error(request, "Credenciais inválidas.")
    return render(request, 'Login/Login.html')

# View para logout
def user_logout(request):
    logout(request)
    messages.success(request, "Você saiu com sucesso.")
    return redirect('login')  # Redireciona para a página de login

# View para registro de usuário
def register(request):
    if request.method == 'POST':
        form = UserCreationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Conta criada com sucesso!")
            return redirect('login')
    else:
        form = UserCreationForm()
    
    return render(request, 'accounts/register.html', {'form': form})
