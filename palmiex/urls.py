from django.contrib import admin
from django.urls import path
from pedidos import views
from django.contrib.auth import views as auth_views  # Importando views de autenticação

from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Login e Logout
    path('', views.home, name='index'),
    path('login/', auth_views.LoginView.as_view(), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    
    
    path('base/',views.base,name='base'),
    path('realiza-pedidos/', views.realiza_pedidos, name='realiza_pedidos'),
    path('cadastrar-vendedor/', views.cadastrar_vendedor, name='cadastrar_vendedor'),
    path('cadastrar-material/', views.cadastrar_material, name='cadastrar_material'),
    path('cadastrar-pedido/', views.cadastrar_pedido, name='cadastrar_pedido'),
    path('vendedores/', views.listar_vendedores, name='listar_vendedores'),
    path('adicionar-item-pedido/<int:pedido_id>/', views.adicionar_item_pedido, name='adicionar_item_pedido'),
    path('buscar-vendedor/', views.buscar_vendedor, name='buscar_vendedor'),
    path('buscar-material/', views.buscar_material, name='buscar_material'),
]


urlpatterns += static(settings.MEDIA_URL, document_root = settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL, document_root = settings.STATIC_ROOT)