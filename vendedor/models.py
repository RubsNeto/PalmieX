# vendedor/models.py

from django.db import models

class Vendedor(models.Model):
    nome = models.CharField(max_length=100)
    data_nascimento = models.DateField()
    codigo = models.CharField(max_length=20, unique=True)

    def __str__(self):
        return self.nome
