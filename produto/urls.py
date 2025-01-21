# produto/urls.py

from django.urls import path
from . import views

app_name = 'produto'

urlpatterns = [
    path('', views.lista_produtos, name='lista_produtos'),
    path('criar/', views.criar_produto, name='criar_produto'),
    path('editar/<int:pk>/', views.editar_produto, name='editar_produto'),
    path('deletar/<int:pk>/', views.deletar_produto, name='deletar_produto'),
    path('<int:produto_id>/relatorio_excel/', views.download_excel_produto, name='relatorio_excel_produto'),
]
