# palmiex/urls.py

from django.contrib import admin
from django.urls import path, include
from autenticacao import views as autenticacao_views  # Importando as views personalizadas
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Login e Logout usando as views personalizadas
    path('login/', autenticacao_views.login_view, name='login'),
    path('logout/', autenticacao_views.logout_view, name='logout'),

    # URLs Principal
    path('', include('pedidos.urls', namespace='pedidos')),
    
    # Vendedor
    path('vendedores/', include('vendedor.urls', namespace='vendedor')),
    
    # Produto
    path('produto/', include('produto.urls', namespace='produtos')),
    
]

# Servir arquivos estáticos e de mídia durante o desenvolvimento
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
