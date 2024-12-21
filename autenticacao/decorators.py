# autenticacao/decorators.py

from django.shortcuts import redirect
from django.core.exceptions import PermissionDenied
from functools import wraps

def permission_required(level):
    """
    Decorator para verificar o nível de permissão do usuário autenticado.
    
    Parâmetros:
        level (int): Nível mínimo de permissão necessário para acessar a view.

    Retorna:
        - A view original, caso o nível de permissão do usuário seja suficiente.
        - Redireciona para a página de login se o usuário não estiver autenticado.
        - Levanta PermissionDenied se o nível de permissão for insuficiente.
    """
    def decorator(view_func):
        @wraps(view_func)  # Preserva o nome e a docstring da view original
        def _wrapped_view(request, *args, **kwargs):
            if request.user.is_authenticated:
                # Verifica o nível de permissão do usuário
                if hasattr(request.user, 'perfil') and request.user.perfil.permission_level >= level:
                    return view_func(request, *args, **kwargs)
                raise PermissionDenied
            return redirect('realiza_pedidos')  # Redireciona se não estiver autenticado
        return _wrapped_view
    return decorator
