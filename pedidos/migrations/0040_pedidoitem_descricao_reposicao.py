# Generated by Django 5.1.4 on 2025-02-11 17:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0039_pedido_data_finalizado'),
    ]

    operations = [
        migrations.AddField(
            model_name='pedidoitem',
            name='descricao_reposicao',
            field=models.TextField(blank=True, null=True),
        ),
    ]
