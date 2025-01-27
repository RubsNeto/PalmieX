# pedidos/models.py

from django.db import models
from vendedor.models import Vendedor
from produto.models import Produto
from django.contrib.auth.models import User

class Pedido(models.Model):
    STATUS_CHOICES = [
        ('Pendente', 'Pendente'),
        ('Em Produção', 'Em Produção'),
        ('Pedido Finalizado', 'Pedido Finalizado'),
        ('Cliente em Espera', 'Cliente em Espera'),
        ('Cancelado', 'Cancelado'),
        ('Pedido Separado','Pedido Separado'),
        ('Reposição pendente', 'Reposição pendente')
        
    ]
    
    STATUS_CHOICES = [
        ('Pendente', 'Pendente'),
        ('Em Produção', 'Em Produção'),
        ('Pedido Finalizado', 'Pedido Finalizado'),
        ('Cliente em Espera', 'Cliente em Espera'),
        ('Cancelado', 'Cancelado'),
        ('Pedido Pronto','Pedido Pronto'),
        ('Reposição Pendente', 'Reposição Pendente')
        
    ]

    cliente = models.CharField(max_length=255)
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    data = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    cancelado = models.TextField(blank=True, null=True, verbose_name="Motivo do Cancelamento")
    gerente_cancelamento = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pedidos_cancelados',
        verbose_name="Gerente que Autorizou o Cancelamento"
    )

    def __str__(self):
        return f"Pedido #{self.pk} - Cliente: {self.cliente}"


# pedidos/models.py

class PedidoItem(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE)
    quantidade = models.IntegerField()
    tamanho = models.IntegerField(null=True, blank=True)

    # === Novos campos específicos: ===
    ref_balancinho = models.CharField(max_length=50, null=True, blank=True)
    mat_balancinho = models.CharField(max_length=50, null=True, blank=True)

    ref_palmilha = models.CharField(max_length=50, null=True, blank=True)
    mat_palmilha = models.CharField(max_length=50, null=True, blank=True)
    tamanho_palmilha = models.CharField(max_length=50, default='0')

    # Um só campo de serviço (radio) em vez de subpalmilha/costura separados.
    TIPO_SERVICO_CHOICES = [
        ('nenhum', 'Nenhum'),
        ('subpalmilha', 'Subpalmilha'),
        ('costura', 'Costura'),
        ('subpalmlha Confot', 'Subpalmilha Confot'),
        ('subpalmilha RV 17', 'Subpalmilha rv 17'),
        ('subpalmlha com Geleia', 'Subpalmilha com Geleia'),
        ('subpalmlha confort com cola', 'Subpalmilha confort com cola'),
        
    ]
    tipo_servico = models.CharField(
        max_length=50,
        choices=TIPO_SERVICO_CHOICES,
        default='nenhum'
    )

    sintetico = models.CharField(max_length=50, null=True, blank=True)
    cor = models.CharField(max_length=50, null=True, blank=True)
    obs = models.TextField(max_length=90,null=True, blank=True)

    def __str__(self):
        return f"{self.quantidade}x (Bal: {self.ref_balancinho}, Palm: {self.ref_palmilha})"

