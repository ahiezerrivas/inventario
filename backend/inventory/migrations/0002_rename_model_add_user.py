from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0001_initial'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='InventoryItemAdminMirror',
            new_name='InventoryItem',
        ),
        migrations.AlterModelOptions(
            name='inventoryitem',
            options={'verbose_name': 'Inventario', 'verbose_name_plural': 'Inventario'},
        ),
        migrations.CreateModel(
            name='User',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('carnet', models.CharField(max_length=255, unique=True)),
                ('name', models.CharField(blank=True, max_length=255)),
                ('cargo_ubicacion', models.CharField(blank=True, max_length=255)),
                ('office', models.CharField(blank=True, max_length=255)),
                ('oficina', models.CharField(blank=True, max_length=255)),
                ('distribucion', models.CharField(blank=True, max_length=255)),
                ('cargo', models.CharField(blank=True, max_length=255)),
                ('extra', models.JSONField(default=dict)),
            ],
            options={
                'verbose_name': 'Usuario',
                'verbose_name_plural': 'Usuarios',
            },
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['carnet'], name='inventory_u_carnet_idx'),
        ),
    ]
