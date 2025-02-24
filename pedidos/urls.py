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
    path('realizar-pedido-urgente/', views.realizar_pedido_urgente, name='realizar_pedido_urgente'),
    path('editar/<int:pedido_id>/', views.editar_pedido, name='editar_pedido'),
    path('cancelar-pedido/<int:pedido_id>/',views.cancelar_pedido, name='cancelar_pedido'),
    path('atualizar-status-pedido/', views.atualizar_status_pedido, name='atualizar_status_pedido'),
    path('imprimir/<int:pedido_id>/', views.imprimir_pedido, name='imprimir_pedido'),
    path('finalizados/', views.pedidos_finalizados, name='pedidos_finalizados'),
    path('autocomplete-produto/', views.autocomplete_produto, name='autocomplete_produto'),
    path('buscar-produto-por-nome/', views.buscar_produto_por_nome, name='buscar_produto_por_nome'),
    path('autocomplete-referencia/', views.autocomplete_referencia, name='autocomplete_referencia'),
    path('buscar-material-por-referencia/', views.buscar_material_por_referencia, name='buscar_material_por_referencia'),
    path("imprimir_direto/<int:pedido_id>/", views.imprimir_pedido_direto, name="imprimir_pedido_direto"),
    path('listar-impressoras/', views.listar_impressoras, name='listar_impressoras'),
]

