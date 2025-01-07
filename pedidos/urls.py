# pedidos/urls.py

from django.urls import path
from . import views

app_name = 'pedidos'

urlpatterns = [
    path('', views.realiza_pedidos, name='realiza_pedidos'),
    path('realiza_pedidos/', views.realiza_pedidos, name='realiza_pedidos'),
    path('producao/', views.producao, name='producao'),
    path('api/pedido/<int:pedido_id>/itens/', views.pedido_itens_api, name='pedido_itens_api'),
    path('buscar-vendedor/', views.buscar_vendedor, name='buscar_vendedor'),
    path('buscar-produto/', views.buscar_produto, name='buscar_produto'),
    path('realizar-pedido/', views.realizar_pedido, name='realizar_pedido'),
    path('atualizar-status-pedido/', views.atualizar_status_pedido, name='atualizar_status_pedido'),
    path('imprimir/<int:pedido_id>/', views.imprimir_pedido, name='imprimir_pedido'),
]

