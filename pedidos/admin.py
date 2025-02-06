# pedidos/admin.py

from django.contrib import admin
from .models import Pedido, PedidoItem, Referencia

@admin.register(Pedido)
class PedidoAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'vendedor', 'data', 'status_balancinho')
    list_filter = ('status_balancinho',)
    search_fields = ('cliente', 'vendedor__nome')

@admin.register(PedidoItem)
class PedidoItemAdmin(admin.ModelAdmin):
    list_display = ('pedido', 'produto', 'quantidade', 'tamanho', 'tipo_servico', 'cor', 'obs')  # 'produto' com p minúsculo
    list_filter = ('produto', 'tamanho', 'tipo_servico', 'cor', 'obs') 
    search_fields = ('produto__nome',) 
