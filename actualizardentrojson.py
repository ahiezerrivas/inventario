import os
import sys
import django
from django.db.models import Q

# 1. Configuración del entorno de Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")  
django.setup()

from inventory.models import InventoryItem

def procesar_y_actualizar_spares_json():
    archivo_salida = "ids_spares_desde_json.txt"
    ids_encontrados = []
    items_a_actualizar = []
    
    ESTADO = "Perdida Total" 

    print("🔍 Buscando en la base de datos registros donde 'extra->status' sea 'Perdida Total'...")

    # Buscamos eficientemente usando la sintaxis de Django para JSONFields (__)
    # __iexact busca el texto exacto ignorando mayúsculas/minúsculas
    queryset = InventoryItem.objects.filter(
       
        Q(extra__observaciones__iexact="Perdida Total")
    )

    for item in queryset:
        ids_encontrados.append(str(item.id))
        
        # Le asignamos el valor al campo físico 'status' del modelo
        item.status = ESTADO
        items_a_actualizar.append(item)

    # Respaldamos los IDs en un archivo txt por seguridad
    with open(archivo_salida, "w") as f:
        f.write("\n".join(ids_encontrados))

    # Guardar masivamente en la Base de Datos
    cantidad_actualizados = len(items_a_actualizar)
    if cantidad_actualizados > 0:
        print(f"🚀 Actualizando {cantidad_actualizados} registros en la base de datos...")
        InventoryItem.objects.bulk_update(items_a_actualizar, ['status'])
    else:
        print("⚠️ No se encontraron registros con 'Perdida Total' dentro del JSON 'extra'.")    

    print("\n" + "="*60)
    print(f"✅ ¡Proceso completado con éxito!")
    print(f"📊 Se actualizaron: {cantidad_actualizados} equipos.")
    print(f"📂 Copia de IDs guardada en: {archivo_salida}")
    print("="*60 + "\n")

if __name__ == "__main__":
    procesar_y_actualizar_spares_json()