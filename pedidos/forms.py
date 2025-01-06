# pedidos/forms.py
from django import forms
from vendedor.models import Vendedor
from produto.models import Produto
from .models import Pedido, PedidoItem

class PedidoUnicoForm(forms.Form):
    """
    Formulário que coleta:
      - cliente
      - vendedor
      - bloco de texto com várias linhas, 
        onde cada linha é "REFERENCIA, TAMANHO=QTD, TAMANHO=QTD, ..."
    Exemplo de uma linha:
      ABC, 36=2, 37=1
    que significa: Produto código "ABC",
                   tamanho 36 => 2 pares,
                   tamanho 37 => 1 par
    Você pode adaptar o formato conforme desejar.
    """
    cliente = forms.CharField(label="Cliente", max_length=100)
    vendedor = forms.ModelChoiceField(
        label="Vendedor",
        queryset=Vendedor.objects.all()
    )
    linhas = forms.CharField(
        label="Itens (uma referência por linha)",
        widget=forms.Textarea,
        help_text=(
            "Digite uma referência por linha. Exemplo:<br>"
            "<code>ABC, 36=2, 37=3<br>"
            "XYZ, 35=1</code>"
        ),
        required=False
    )

    def save(self):
        """
        Cria o Pedido e seus respectivos PedidoItem de acordo com as linhas.
        Retorna o objeto Pedido criado.
        """
        # 1) Coleta dados básicos
        cliente = self.cleaned_data['cliente']
        vendedor_obj = self.cleaned_data['vendedor']

        # 2) Cria o Pedido
        pedido = Pedido.objects.create(
            cliente=cliente,
            vendedor=vendedor_obj
        )

        # 3) Processa 'linhas'
        texto = self.cleaned_data.get('linhas', '').strip()
        if not texto:
            return pedido  # sem itens

        linhas = texto.split('\n')
        for linha in linhas:
            linha = linha.strip()
            if not linha:
                continue

            # Exemplo de linha: "ABC, 36=2, 37=3"
            partes = linha.split(',')
            # partes[0] => "ABC"
            # partes[1] => " 36=2"
            # partes[2] => " 37=3"

            referencia_str = partes[0].strip()  # "ABC"
            if not referencia_str:
                continue

            # cria ou busca o Produto pelo campo .codigo
            produto_obj, _ = Produto.objects.get_or_create(
                codigo=referencia_str,
                defaults={'nome': referencia_str}  # se quiser
            )

            # tamanhos
            for p in partes[1:]:
                p = p.strip()  # ex: "36=2"
                if '=' not in p:
                    continue
                tam_str, qtd_str = p.split('=', 1)
                tam_str = tam_str.strip()
                qtd_str = qtd_str.strip()

                try:
                    tamanho = int(tam_str)
                    qtd = int(qtd_str)
                except ValueError:
                    continue  # se não for número, ignora

                if qtd > 0:
                    # Cria o PedidoItem
                    PedidoItem.objects.create(
                        pedido=pedido,
                        Produto=produto_obj,
                        quantidade=qtd
                    )

        return pedido
