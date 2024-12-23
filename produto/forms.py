# produto/forms.py

from django import forms
from .models import Produto

class ProdutoForm(forms.ModelForm):
    class Meta:
        model = Produto
        fields = ['nome', 'codigo']
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nome do Produto'}),
            'codigo': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Código do Produto'}),
        }
