# Generated by Django 5.1.4 on 2025-01-06 14:40

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0003_remove_pedidoitem_material_alter_pedido_vendedor_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedidoitem',
            name='tamanho',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
