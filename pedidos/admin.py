# pedidos/admin.py

from django.contrib import admin
from .models import Pedido, PedidoItem

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('id', 'cliente', 'vendedor', 'data', 'status', 'total')
    list_filter = ('status', 'vendedor')
    search_fields = ('cliente', 'vendedor__nome')

@admin.register(PedidoItem)
class PedidoItemAdmin(admin.ModelAdmin):
    list_display = ('pedido', 'produto', 'quantidade', 'tamanho')  # 'produto' com p minúsculo
    list_filter = ('produto', 'tamanho')  # 'produto' com p minúsculo
    search_fields = ('produto__nome',)  # 'produto' com p minúsculo
