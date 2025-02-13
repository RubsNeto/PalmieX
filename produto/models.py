# produto/models.py

from django.db import models

class Produto(models.Model):
    nome = models.CharField(max_length=100)
    codigo = models.CharField(max_length=50, unique=True)
    subpalmilha = models.BooleanField(default=False, null=True, blank=True)

    def __str__(self):
        return f"{self.nome} ({self.codigo})"
    