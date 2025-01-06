# palmiex/urls.py
from django.contrib import admin
from django.urls import path, include
from pedidos import views as pedidos_views
from autenticacao import views as autenticacao_views  # Importando as views personalizadas
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Login e Logout usando as views personalizadas
    path('login/', autenticacao_views.login_view, name='login'),
    path('logout/', autenticacao_views.logout_view, name='logout'),

    # URLs Principal
    path('', pedidos_views.realiza_pedidos, name='index'),
    path('realiza_pedidos/', pedidos_views.realiza_pedidos, name='realiza_pedidos'),
    path('producao/', pedidos_views.producao, name='producao'),
    
    #vendedor
    path('vendedores/', include('vendedor.urls', namespace='vendedor')),
    
    #vendedor
    path('produto/', include('produto.urls', namespace='produtos')),
    
    #Buscas de vendedor e material
    path('buscar-vendedor/', pedidos_views.buscar_vendedor, name='buscar_vendedor'),
    path('buscar-produto/', pedidos_views.buscar_produto, name='buscar_material'),
    path('realizar-pedido', pedidos_views.realizar_pedido, name='realizar_pedido'),
]

# Servir arquivos estáticos e de mídia durante o desenvolvimento
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
