# Inventario - Django REST + React + PostgreSQL

## Estructura
- `backend/`: API en Django REST conectada a PostgreSQL
- `frontend/`: interfaz React (Vite)

## Backend
1. Ir a `backend/`
2. Crear archivo `.env` a partir de `.env.example`
3. Instalar dependencias (si hace falta):
   - `c:/Users/admin-c606401/Documents/inventario/.venv/Scripts/python.exe -m pip install -r requirements.txt`
4. Ejecutar servidor:
   - `c:/Users/admin-c606401/Documents/inventario/.venv/Scripts/python.exe manage.py runserver`

API disponible en:
- `GET/POST http://127.0.0.1:8000/api/inventory/`
- `GET/PUT/DELETE http://127.0.0.1:8000/api/inventory/<id>/`

Aplicar migraciones (crea las tablas en PostgreSQL):
   - `c:/Users/admin-c606401/Documents/inventario/.venv/Scripts/python.exe manage.py migrate`

Importar Excel a PostgreSQL:
`c:/Users/admin-c606401/Documents/inventario/.venv/Scripts/python.exe manage.py import_inventory_excel --file "c:/Users/admin-c606401/Documents/inventario/INVENTARIO GENERAL PROYECTO ACTUALIZACION TECNOLOGICA OCTUBRE 2026 VF 3.0..xlsx"`




`c:/Users/admin-c606401/Documents/inventario/.venv/Scripts/python.exe manage.py import_inventory_excel --file "c:/Users/admin-c606401/Documents/inventario/Copia de Inventario General Logistica y Soporte en Sitio ACTUALIZADA VF OCTUBRE 2026 1-9-2026 (version 1).xlsx"`

## Frontend
1. Ir a `frontend/`
2. Crear archivo `.env` a partir de `.env.example`
3. Instalar dependencias (si hace falta):
   - `npm.cmd install`
4. Ejecutar frontend:
   - `npm.cmd run dev`

## PostgreSQL
Asegurate de tener PostgreSQL corriendo localmente y de crear la base de datos `inventario_db`.
Ajusta las credenciales (`POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`) en `backend/.env`.
