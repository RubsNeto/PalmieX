# vendedor/admin.py

from django.contrib import admin
from .models import Vendedor

@admin.register(Vendedor)
class VendedorAdmin(admin.ModelAdmin):
    list_display = ('nome', 'loja', 'codigo')
    search_fields = ('nome', 'codigo')
