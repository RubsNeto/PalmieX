# vendedor/urls.py

from django.urls import path
from . import views

app_name = 'vendedor'

urlpatterns = [
    path('', views.lista_vendedores, name='lista_vendedores'),
    path('novo/', views.criar_vendedor, name='criar_vendedor'),
    path('<int:pk>/editar/', views.editar_vendedor, name='editar_vendedor'),
    path('<int:pk>/deletar/', views.deletar_vendedor, name='deletar_vendedor'),
]
