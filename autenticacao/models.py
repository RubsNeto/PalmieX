from django.contrib.auth.models import User
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver

PRODUCTION_AREAS = (
    ('solado', 'Solado'),
    ('balancinho', 'Balancinho'),
)

class Perfil(models.Model):
    PERMISSION_LEVELS = (
        (1, 'Nível 1'),
        (2, 'Nível 2'),
        (3, 'Nível 3'),
        (4, 'Nível 4')
    )
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    permission_level = models.PositiveSmallIntegerField(choices=PERMISSION_LEVELS, default=1)
    # Novo campo para identificar a área de produção:
    production_area = models.CharField(
        max_length=20,
        choices=PRODUCTION_AREAS,
        default='solado',
        verbose_name="Área de Produção"
    )

    def __str__(self):
        return f"{self.user.username} - {self.get_permission_level_display()} - {self.production_area}"

@receiver(post_save, sender=User)
def criar_perfil_usuario(sender, instance, created, **kwargs):
    if created:
        Perfil.objects.create(user=instance)

def get_permission_level(self):
    return self.perfil.permission_level if hasattr(self, 'perfil') else 0

User.add_to_class('permission_level', property(get_permission_level))
