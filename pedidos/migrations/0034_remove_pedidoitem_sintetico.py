# Generated by Django 5.1.4 on 2025-02-03 17:53

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pedidos', '0033_pedidoitem_cor_palmilha_pedidoitem_tam_palmilha_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='pedidoitem',
            name='sintetico',
        ),
    ]
