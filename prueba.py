import os
import sys
import django

# 1. Configuración del entorno de Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")  
django.setup()

from inventory.models import InventoryItem

def procesar_y_actualizar_spares():
    archivo_salida = "ids_actualizados_spares.txt"
    ids_encontrados = []
    items_a_actualizar = []
    
    # Estado que le vas a poner en la columna física 'status'
    ESTADO= "No se ubica" 

    print("🔍 Buscando equipos donde assignee sea 'No se ubica'...")

    # Buscamos directamente en la base de datos usando un filtro eficiente
    # .filter(assignee__iexact=...) busca sin importar mayúsculas/minúsculas
    queryset = InventoryItem.objects.filter(assignee__iexact="No se ubica")

    for item in queryset:
        ids_encontrados.append(str(item.id))
        
        # Asignamos el nuevo estado al campo físico
        item.status = ESTADO
        items_a_actualizar.append(item)

    # Guardamos un respaldo de los IDs modificados por seguridad
    with open(archivo_salida, "w") as f:
        f.write("\n".join(ids_encontrados))

    # Guardar masivamente en la Base de Datos
    cantidad_actualizados = len(items_a_actualizar)
    if cantidad_actualizados > 0:
        print(f"🚀 Actualizando {cantidad_actualizados} registros en la base de datos...")
        InventoryItem.objects.bulk_update(items_a_actualizar, ['status'])
    else:
        print("⚠️ No se encontraron equipos con assignee = 'No se ubica'.")

    print("\n" + "="*60)
    print(f"✅ ¡Proceso de spares completado con éxito!")
    print(f"📊 Se actualizaron: {cantidad_actualizados} equipos.")
    print(f"📂 IDs guardados en: {archivo_salida}")
    print("="*60 + "\n")

if __name__ == "__main__":
    procesar_y_actualizar_spares()