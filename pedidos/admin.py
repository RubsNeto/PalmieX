# admin.py
from django.contrib import admin
from .models import Pedido, PedidoItem

# Remova qualquer definição de "class Pedido(models.Model):" aqui!
# Em vez disso, crie APENAS o Admin para esse modelo:

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ["id", "cliente", "vendedor", "data"]
    # sua configuração extra aqui

@admin.register(PedidoItem)
class PedidoItemAdmin(admin.ModelAdmin):
    list_display = ["id", "pedido", "Produto", "quantidade"]
