from django.core.management.base import BaseCommand
from inventory.models import InventoryItem, User


class Command(BaseCommand):
    help = 'Extrae usuarios únicos del inventario y los guarda en la tabla de usuarios'

    def handle(self, *args, **options):
        items = InventoryItem.objects.all()

        users_dict = {}
        processed = 0

        for item in items:
            carnet = item.extra.get('carnet', '').strip() if item.extra else ''

            if not carnet:
                continue

            if carnet in users_dict:
                continue

            users_dict[carnet] = {
                'name': item.assignee or item.extra.get('usuario', ''),
                'cargo_ubicacion': item.extra.get('cargo ubicacion', ''),
                'office': item.office or '',
                'oficina': item.extra.get('oficina', ''),
                'distribucion': item.extra.get('distribucion', ''),
                'cargo': item.extra.get('cargo', ''),
            }
            processed += 1

        created = 0
        updated = 0

        for carnet, user_data in users_dict.items():
            _, is_new = User.objects.update_or_create(
                carnet=carnet,
                defaults=user_data,
            )
            if is_new:
                created += 1
            else:
                updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'✓ Usuarios extraídos: {processed} únicos\n'
                f'✓ Creados: {created}\n'
                f'✓ Actualizados: {updated}'
            )
        )
