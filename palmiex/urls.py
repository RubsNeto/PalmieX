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

    # Outras URLs
    path('', pedidos_views.realiza_pedidos, name='index'),
    path('realiza_pedidos/', pedidos_views.realiza_pedidos, name='realiza_pedidos'),
    path('cadastrar-material/', pedidos_views.cadastrar_material, name='cadastrar_material'),
    path('cadastrar-pedido/', pedidos_views.cadastrar_pedido, name='cadastrar_pedido'),
    path('adicionar-item-pedido/<int:pedido_id>/', pedidos_views.adicionar_item_pedido, name='adicionar_item_pedido'),
    path('buscar-material/', pedidos_views.buscar_material, name='buscar_material'),
    
    #vendedor
    path('vendedores/', include('vendedor.urls', namespace='vendedor')),
    
    #vendedor
    path('produto/', include('produto.urls', namespace='produtos')),
]

# Servir arquivos estáticos e de mídia durante o desenvolvimento
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
