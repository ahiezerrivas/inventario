from __future__ import annotations

from collections import Counter, defaultdict

from django.core.management.base import BaseCommand

from inventory.models import InventoryItem

# Etiqueta canonica forzada para ciertos tipos (clave = tipo normalizado en minusculas).
PREFERRED_LABELS = {
    "pc": "PC",
    "tv": "TV",
    "kiosko": "KIOSKO",
    "server": "Server",
    "laptop": "Laptop",
    "tablet": "Tablet",
    "smartphone": "Smartphone",
    "headset": "Headset",
}


def normalize_key(value: str) -> str:
    return " ".join(str(value or "").split()).lower()


class Command(BaseCommand):
    help = "Unifica valores de asset_type que solo difieren por mayusculas/minusculas o espacios."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Muestra los cambios que se harian sin modificar la base de datos.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        # Cuenta cada variante (recortada) por clave normalizada.
        variants_by_key: dict[str, Counter] = defaultdict(Counter)
        for asset_type in InventoryItem.objects.values_list("asset_type", flat=True):
            trimmed = " ".join(str(asset_type or "").split())
            if not trimmed:
                continue
            variants_by_key[normalize_key(trimmed)][trimmed] += 1

        # Determina la etiqueta canonica por clave.
        canonical_by_key: dict[str, str] = {}
        for key, variants in variants_by_key.items():
            if key in PREFERRED_LABELS:
                canonical_by_key[key] = PREFERRED_LABELS[key]
            else:
                canonical_by_key[key] = variants.most_common(1)[0][0]

        # Aplica los cambios.
        to_update = []
        changes = Counter()
        for item in InventoryItem.objects.all().only("id", "asset_type"):
            trimmed = " ".join(str(item.asset_type or "").split())
            key = normalize_key(trimmed)
            if not key:
                continue
            canonical = canonical_by_key[key]
            if item.asset_type != canonical:
                changes[(item.asset_type, canonical)] += 1
                item.asset_type = canonical
                to_update.append(item)

        if not dry_run:
            InventoryItem.objects.bulk_update(to_update, ["asset_type"], batch_size=1000)

        self.stdout.write(self.style.SUCCESS("Dry-run (sin cambios):" if dry_run else "Unificacion aplicada."))
        for (old, new), count in sorted(changes.items(), key=lambda kv: -kv[1]):
            self.stdout.write(f"  '{old}' -> '{new}' ({count})")
        self.stdout.write(f"Total registros actualizados: {len(to_update)}")
        self.stdout.write(f"Tipos distintos resultantes: {len(canonical_by_key)}")
