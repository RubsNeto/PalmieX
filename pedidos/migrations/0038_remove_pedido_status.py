# Generated by Django 5.1.4 on 2025-02-06 19:45

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0037_remove_pedidoitem_tam_palmilha_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pedido',
            name='status',
        ),
    ]
