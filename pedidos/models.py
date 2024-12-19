from django.db import models

class Vendedor(models.Model):
    codigo = models.CharField(max_length=20, unique=True)
    nome = models.CharField(max_length=100)

    def __str__(self):
        return self.nome

class Material(models.Model):
    nome = models.CharField(max_length=100)
    tamanho_pe = models.IntegerField()  # Tamanho do pé (ex: 36, 37, etc.)

    def __str__(self):
        return f"{self.nome} - Tamanho {self.tamanho_pe}"

class Pedido(models.Model):
    cliente = models.CharField(max_length=100)
    vendedor = models.ForeignKey(Vendedor, on_delete=models.CASCADE)
    data = models.DateField(auto_now_add=True)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Pedido {self.id} - {self.cliente}"

class PedidoItem(models.Model):
    pedido = models.ForeignKey(Pedido, on_delete=models.CASCADE)
    material = models.ForeignKey(Material, on_delete=models.CASCADE)
    quantidade = models.IntegerField()

    def __str__(self):
        return f"{self.quantidade} x {self.material.nome} (Tamanho {self.material.tamanho_pe})"
