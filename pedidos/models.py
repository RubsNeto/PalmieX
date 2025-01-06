# pedidos/models.py

from django.db import models
from vendedor.models import Vendedor
from produto.models import Produto

class Pedido(models.Model):
    STATUS_CHOICES = [
        ('Pendente', 'Pendente'),
        ('Em Produção', 'Em Produção'),
        ('Pedido Finalizado', 'Pedido Finalizado'),
    ]

    cliente = models.CharField(max_length=100)
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    data = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pendente')
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Pedido #{self.pk} - Cliente: {self.cliente}"


class PedidoItem(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE)
    quantidade = models.IntegerField()
    tamanho = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.quantidade}x {self.produto} (Tamanho {self.tamanho})"
