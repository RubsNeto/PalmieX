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
        ('Pedido Pronto', 'Pedido Pronto'),
        ('Reposição Pendente', 'Reposição Pendente')
    ]
    
    # Dados do pedido
    cliente = models.CharField(max_length=255)
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    data = models.DateTimeField(auto_now_add=True)  # Data do pedido
    descricao_reposicao = models.TextField(null=True, blank=True)

    # Novo campo para data de finalização/cancelamento
    data_finalizado = models.DateTimeField(null=True, blank=True, verbose_name="Data de Finalização/Cancellation")
    
    # Status para áreas diferentes
    status_balancinho = models.CharField(
        max_length=30,
        choices=[
            ('Pendente', 'Pendente'),
            ('Em Produção', 'Em Produção'),
            ('Pedido Finalizado', 'Pedido Finalizado'),
            ('Cancelado', 'Cancelado'),
        ],
        default='Pendente'
    )
    status_solado = models.CharField(
        max_length=30,
        choices=[
            ('Pendente', 'Pendente'),
            ('Em Produção', 'Em Produção'),
            ('Pedido Finalizado', 'Pedido Finalizado'),
            ('Cancelado', 'Cancelado'),
        ],
        default='Pendente'
    )
    
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


class PedidoItem(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE)
    quantidade = models.IntegerField()
    tamanho = models.IntegerField(null=True, blank=True)  # Pode ser utilizado para o grid de tamanhos

    # Campos referentes ao Balancinho
    ref_balancinho = models.CharField(max_length=50, null=True, blank=True)
    mat_balancinho = models.CharField(max_length=50, null=True, blank=True)

    # Campos referentes à Palmilha/Solado
    ref_palmilha = models.CharField(max_length=50, null=True, blank=True)
    mat_palmilha = models.CharField(max_length=50, null=True, blank=True)
    
    # Novos campos para tamanhos e cor específica da palmilha
    espessura = models.CharField(max_length=20, null=True, blank=True, verbose_name="Espessura Solado (mm)")
    
    cor_palmilha = models.CharField(max_length=50, null=True, blank=True, verbose_name="Cor da Palmilha")
    tipo_servico = models.CharField(max_length=50, default='nenhum')
    cor = models.CharField(max_length=50, null=True, blank=True)
    
    # Campo para Marca, com choices
    MARCA_CHOICES = [
        ('Fibra', 'Fibra'),
        ('Seltex', 'Seltex'),
        ('Induma','Induma')
    ]
    marca = models.CharField(max_length=50, choices=MARCA_CHOICES, default='')

    obs = models.TextField(max_length=90, null=True, blank=True)

    def __str__(self):
        return f"{self.quantidade}x (Bal: {self.ref_balancinho}, Palm: {self.ref_palmilha})"


class Referencia(models.Model):
    nome = models.CharField(max_length=255)
    descricao = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.nome
