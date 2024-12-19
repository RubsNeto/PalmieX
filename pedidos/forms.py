from django import forms
from .models import Vendedor, Material, Pedido, PedidoItem

class VendedorForm(forms.ModelForm):
    class Meta:
        model = Vendedor
        fields = ['codigo', 'nome']

class MaterialForm(forms.ModelForm):
    class Meta:
        model = Material
        fields = ['nome', 'tamanho_pe']

class PedidoForm(forms.ModelForm):
    class Meta:
        model = Pedido
        fields = ['cliente', 'vendedor']

class PedidoItemForm(forms.ModelForm):
    class Meta:
        model = PedidoItem
        fields = ['material', 'quantidade']
