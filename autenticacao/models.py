# autenticacao/models.py

from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

class Perfil(models.Model):
    PERMISSION_LEVELS = (
        (1, 'Nível 1'),
        (2, 'Nível 2'),
        (3, 'Nível 3'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    permission_level = models.PositiveSmallIntegerField(choices=PERMISSION_LEVELS, default=1)

    def __str__(self):
        return f"{self.user.username} - {self.get_permission_level_display()}"

@receiver(post_save, sender=User)
def criar_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(user=instance)

# Adicione esta propriedade para facilitar o acesso
def get_permission_level(self):
    return self.perfil.permission_level if hasattr(self, 'perfil') else 0

User.add_to_class('permission_level', property(get_permission_level))
