# vendedor/models.py

from django.db import models

class Vendedor(models.Model):
    nome = models.CharField(max_length=100)
    loja = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.nome
