from collections import Counter
from io import BytesIO
from datetime import datetime

from django.db.models import Q, TextField, Value
from django.db.models.expressions import RawSQL
from django.db.models.fields.json import KeyTextTransform
from django.db.models.functions import Cast, Coalesce
from django.http import HttpResponse
from openpyxl import Workbook
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import InventoryItem, User
from .serializers import InventoryItemSerializer, UserSerializer


def _to_payload(item: InventoryItem) -> dict:
    return {
        "id": str(item.id),
        "source_sheet": item.source_sheet,
        "asset_code": item.asset_code or "",
        "asset_type": item.asset_type or "",
        "model": item.model or "",
        "serial": item.serial or "",
        "assignee": item.assignee or "",
        "office": item.office or "",
        "status": item.status or "",
        "extra": item.extra or {},
    }


def _normalized_serial(serial_value: str) -> str:
    return str(serial_value or "").strip()


def _resolve_payload_serial(data: dict) -> str:
    extra = data.get("extra") or {}
    return _normalized_serial(data.get("serial") or extra.get("serial equipo") or extra.get("serial") or "")


def _serial_exists(serial_value: str, exclude_id=None) -> bool:
    serial = _normalized_serial(serial_value)
    if not serial:
        return False

    qs = InventoryItem.objects.annotate(
        _extra_text=Cast('extra', output_field=TextField())
    ).filter(
        Q(serial__iexact=serial) | Q(_extra_text__icontains=serial)
    )
    if exclude_id:
        qs = qs.exclude(pk=exclude_id)

    return qs.exists()


def _xlsx_response(filename: str, headers: list[str], rows: list[list]) -> HttpResponse:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.title = "INVENTARIO GENERAL"
    worksheet.append(headers)
    for row in rows:
        worksheet.append(row)

    buffer = BytesIO()
    workbook.save(buffer)
    buffer.seek(0)

    response = HttpResponse(
        buffer.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M")
    response["Content-Disposition"] = f'attachment; filename="{filename}_{timestamp}.xlsx"'
    return response


PAGE_SIZE = 50

# Campos de 'extra' que NO deben participar en la busqueda de texto libre.
SEARCH_EXCLUDED_EXTRA_KEYS = ["personal retirado transferido"]


def _inventory_base_qs():
    return InventoryItem.objects.annotate(
        _extra_text=RawSQL(
            "(extra - %s::text[])::text",
            [SEARCH_EXCLUDED_EXTRA_KEYS],
            output_field=TextField(),
        ),
        _carnet=KeyTextTransform("carnet", "extra"),
        _distribucion=KeyTextTransform("distribucion", "extra"),
    )




def _apply_inventory_filters(queryset, request):
    source_sheet = request.query_params.get("source_sheet")
    search = request.query_params.get("search", "").strip()
    asset_type_filter = request.query_params.get("asset_type", "").strip()
    user_card_filter = request.query_params.get("user_card", "").strip()
    asset_code_filter = request.query_params.get("asset_code", "").strip()
    
    # 🚀 NUEVO PARÁMETRO ÚNICO Y DINÁMICO
    # El Frontend simplemente enviará ?status_filter=embalado o ?status_filter=spare
    status_filter = request.query_params.get("status_filter", "").strip().lower()

    if source_sheet:
        queryset = queryset.filter(source_sheet=source_sheet)

    # 📊 FILTRADO DE ESTADOS 100% DINÁMICO
    if status_filter:
        if status_filter == "sin status":
            # Si se pide "sin status", filtramos los registros que tengan el campo vacío o nulo
            queryset = queryset.filter(Q(status="") | Q(status__isnull=True))
        else:
            # Para cualquier otro estado ("instalado", "embalado", "spare", "filial", etc.)
            # la base de datos lo resuelve en una sola línea ultra rápida.
            queryset = queryset.filter(status__iexact=status_filter)

    # --- Filtros estándar de búsqueda ---
    if search:
        queryset = queryset.filter(
            Q(serial__icontains=search) |
            Q(assignee__icontains=search) |
            Q(model__icontains=search) |
            Q(asset_type__icontains=search) |
            Q(office__icontains=search) |
            Q(extra__carnet__icontains=search)
        )
        
    if asset_type_filter:
        queryset = queryset.filter(asset_type__icontains=asset_type_filter)
        
    if user_card_filter:
        queryset = queryset.filter(
            Q(assignee__icontains=user_card_filter) |
            Q(extra__carnet__icontains=user_card_filter)
        )
        
    if asset_code_filter:
        queryset = queryset.filter(asset_code__icontains=asset_code_filter)

    return queryset


def _user_base_qs():
    return User.objects.all()


def _apply_user_filters(queryset, request):
    search = request.query_params.get("users_search", request.query_params.get("search", "")).strip()
    if search:
        queryset = queryset.filter(
            Q(carnet__icontains=search) |
            Q(name__icontains=search) |
            Q(office__icontains=search) |
            Q(oficina__icontains=search) |
            Q(distribucion__icontains=search) |
            Q(cargo__icontains=search) |
            Q(cargo_ubicacion__icontains=search)
        )
    return queryset


def _has_inventory_filters(request) -> bool:
    return any([
        bool(request.query_params.get("source_sheet")),
        bool(request.query_params.get("search", "").strip()),
        bool(request.query_params.get("asset_type", "").strip()),
        bool(request.query_params.get("user_card", "").strip()),
        bool(request.query_params.get("asset_code", "").strip()),
    ])


def _distribution_label_score(label: str) -> int:
    if label == label.title():
        return 3
    if not label.isupper() and not label.islower():
        return 2
    if label.isupper():
        return 1
    return 0


def _merge_distribution_counter(counter: Counter) -> Counter:
    totals_by_key = {}
    preferred_label_by_key = {}

    for raw_label, total in counter.items():
        label = str(raw_label or "").strip() or "Sin distribucion"
        key = label.lower()

        totals_by_key[key] = totals_by_key.get(key, 0) + total

        current_label = preferred_label_by_key.get(key)
        if not current_label:
            preferred_label_by_key[key] = label
            continue

        if _distribution_label_score(label) > _distribution_label_score(current_label):
            preferred_label_by_key[key] = label

    merged = Counter()
    for key, total in totals_by_key.items():
        merged[preferred_label_by_key[key]] = total

    return merged


def _normalize_asset_type_label(value: str) -> str:
    trimmed = str(value or "").strip()
    if not trimmed:
        return ""

    canonical = {
        "pc": "PC",
        "kiosko": "KIOSKO",
        "laptop": "Laptop",
        "server": "Server",
        "tablet": "Tablet",
    }

    return canonical.get(trimmed.lower(), trimmed)


class InventoryListCreateView(APIView):
    def get(self, request):
        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except ValueError:
            page = 1

        queryset = _apply_inventory_filters(_inventory_base_qs(), request)

        total = queryset.count()
        offset = (page - 1) * PAGE_SIZE
        items = [_to_payload(item) for item in queryset.order_by("-id")[offset:offset + PAGE_SIZE]]

        return Response({
            "total": total,
            "page": page,
            "page_size": PAGE_SIZE,
            "pages": max(1, -(-total // PAGE_SIZE)),
            "results": items,
        })

    def post(self, request):
        serializer = InventoryItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        serial_value = _resolve_payload_serial(serializer.validated_data)
        if _serial_exists(serial_value):
            return Response(
                {"detail": "El serial ya existe. No se permiten seriales duplicados."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        item = InventoryItem(**serializer.validated_data)
        item.save()
        return Response(_to_payload(item), status=status.HTTP_201_CREATED)


class InventoryDetailView(APIView):
    def get_object(self, item_id: str):
        try:
            return InventoryItem.objects.get(pk=item_id)
        except (InventoryItem.DoesNotExist, ValueError):
            return None

    def get(self, request, item_id):
        item = self.get_object(item_id)
        if not item:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(_to_payload(item))

    def put(self, request, item_id):
        item = self.get_object(item_id)
        if not item:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = InventoryItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        serial_value = _resolve_payload_serial(serializer.validated_data)
        if _serial_exists(serial_value, exclude_id=item.pk):
            return Response(
                {"detail": "El serial ya existe. No se permiten seriales duplicados."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for key, value in serializer.validated_data.items():
            setattr(item, key, value)
        item.save()

        return Response(_to_payload(item))

    def delete(self, request, item_id):
        item = self.get_object(item_id)
        if not item:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


def _user_to_payload(user: User) -> dict:
    return {
        "id": str(user.id),
        "carnet": user.carnet,
        "name": user.name or "",
        "cargo_ubicacion": user.cargo_ubicacion or "",
        "office": user.office or "",
        "oficina": user.oficina or "",
        "distribucion": user.distribucion or "",
        "cargo": user.cargo or "",
        "extra": user.extra or {},
    }


def _get_user_by_carnet(carnet: str):
    normalized = str(carnet or "").strip()
    if not normalized:
        return None
    try:
        return User.objects.get(carnet=normalized)
    except User.DoesNotExist:
        return User.objects.filter(carnet__iexact=normalized).first()


class UserDetailView(APIView):
    def get(self, request, carnet):
        user = _get_user_by_carnet(carnet)
        if not user:
            return Response({"detail": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)
        return Response(_user_to_payload(user))

    def put(self, request, carnet):
        user = _get_user_by_carnet(carnet)
        if not user:
            return Response({"detail": "Usuario no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        serializer = UserSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        new_carnet = data.get("carnet", "").strip()
        if new_carnet and new_carnet != user.carnet:
            if User.objects.filter(carnet=new_carnet).exists():
                return Response({"detail": "El carnet ya existe"}, status=status.HTTP_400_BAD_REQUEST)

        user.carnet = new_carnet or user.carnet
        user.name = data.get("name", "")
        user.cargo_ubicacion = data.get("cargo_ubicacion", "")
        user.office = data.get("office", "")
        user.oficina = data.get("oficina", "")
        user.distribucion = data.get("distribucion", "")
        user.cargo = data.get("cargo", "")
        user.extra = data.get("extra", user.extra or {})
        user.save()

        return Response(_user_to_payload(user))


class UsersListView(APIView):
    def get(self, request):
        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except ValueError:
            page = 1

        # If inventory filters are present, restrict users to matched carnets
        if _has_inventory_filters(request):
            inv_qs = _apply_inventory_filters(_inventory_base_qs(), request)
            carnets = set()
            for item in inv_qs.values("extra", "assignee"):
                carnet = str((item["extra"] or {}).get("carnet") or "").strip()
                if carnet:
                    carnets.add(carnet)
            queryset = _apply_user_filters(
                _user_base_qs().filter(carnet__in=carnets), request
            )
        else:
            queryset = _apply_user_filters(_user_base_qs(), request)

        total = queryset.count()
        offset = (page - 1) * PAGE_SIZE
        users = [_user_to_payload(user) for user in queryset.order_by("carnet")[offset:offset + PAGE_SIZE]]

        return Response({
            "total": total,
            "page": page,
            "page_size": PAGE_SIZE,
            "pages": max(1, -(-total // PAGE_SIZE)),
            "results": users,
        })


class CodesListView(APIView):
    def get(self, request):
        search = request.query_params.get("search", "").strip().lower()

        codes = set()
        for item in InventoryItem.objects.values("asset_code", "extra"):
            if item["asset_code"]:
                codes.add(item["asset_code"].strip())
            extra_code = (item["extra"] or {}).get("cod.", "")
            if extra_code:
                codes.add(str(extra_code).strip())

        results = sorted([code for code in codes if code])
        if search:
            results = [code for code in results if search in code.lower()]

        return Response({
            "total": len(results),
            "results": results,
        })


class EquipmentTypesListView(APIView):
    def get(self, request):
        source_sheet = request.query_params.get("source_sheet", "").strip()

        qs = InventoryItem.objects.values("asset_type", "extra")
        if source_sheet:
            qs = qs.filter(source_sheet=source_sheet)

        types_by_lower = {}
        for item in qs:
            raw_type = item["asset_type"] or (item["extra"] or {}).get("tipo de equipo") or ""
            normalized = _normalize_asset_type_label(raw_type)
            if not normalized:
                continue
            key = normalized.lower()
            if key not in types_by_lower:
                types_by_lower[key] = normalized

        results = sorted(types_by_lower.values(), key=lambda value: value.lower())

        return Response({
            "total": len(results),
            "results": results,
        })


class DashboardSummaryView(APIView):
    def get(self, request):
        users_search_term = request.query_params.get("users_search", "").strip()

        items = list(_apply_inventory_filters(_inventory_base_qs(), request))
        inventory_filters_active = _has_inventory_filters(request)
        users = list(_apply_user_filters(_user_base_qs(), request))

        # Contadores dinámicos usando Counter
        status_counter = Counter()  # 👈 Aquí se agruparán TODOS los estados dinámicamente
        source_counter = Counter()
        type_counter = Counter()
        office_counter = Counter()
        missing_serial_total = 0

        for item in items:
            extra = item.extra or {}
            source = item.source_sheet or extra.get("ubicacion") or "Sin ubicacion"
            asset_type = item.asset_type or extra.get("tipo de equipo") or "Sin tipo"
            office = item.office or extra.get("oficina") or "Sin oficina"
            serial = item.serial or extra.get("serial equipo") or extra.get("serial") or ""
            
            # Capturamos el estado real del campo físico (normalizado a minúsculas)
            # Si viene vacío o None, lo agrupamos como "sin status"
            status_real = (item.status or "").strip().lower()
            if not status_real:
                status_real = "sin status"

            # Incrementamos los contadores correspondientes
            status_counter[status_real] += 1
            source_counter[source] += 1
            type_counter[asset_type.lower()] += 1
            office_counter[office] += 1

            if not str(serial).strip():
                missing_serial_total += 1

        # [Mantenemos la lógica de usuarios intacta...]
        distribution_counter = Counter()
        for user in users:
            distribution = user.distribucion or "Sin distribucion"
            distribution_counter[distribution] += 1
        users_total = len(users)

        distribution_counter = _merge_distribution_counter(distribution_counter)

        # RETORNAMOS LAS MÉTRICAS FLEXIBLES AL FRONTEND
        return Response({
            "inventory_total": len(items),
            "users_total": users_total,
            "missing_serial_total": missing_serial_total,
            
            # 👈 NUEVO FORMATEO DINÁMICO: 
            # Convierte el Counter en un diccionario limpio { "instalado": 7188, "embalado": 1945, ... }
            "status_totals": dict(status_counter), 
            
            # O si el frontend prefiere formato lista como los de abajo:
            "by_status": [{"label": label.capitalize(), "total": total} for label, total in status_counter.items()],

            "by_source": [{"label": label, "total": total} for label, total in source_counter.most_common()],
            "by_type": [{"label": label.capitalize(), "total": total} for label, total in type_counter.most_common(6)],
            "top_offices": [{"label": label, "total": total} for label, total in office_counter.most_common(6)],
            "user_distribution": [{"label": label, "total": total} for label, total in distribution_counter.most_common(6)],
        })

class InventoryReportExportView(APIView):
    def get(self, request):
        queryset = _apply_inventory_filters(_inventory_base_qs(), request)
        items = [_to_payload(item) for item in queryset.order_by("-id")]

        headers = [
            "serial equipo",
            "hostname",
            "ubicacion",
            "tipo de equipo",
            "usuario",
            "carnet",
            "ext",
            "cod.",
            "oficina",
            "piso region",
            "cargo ubicacion",
            "sistema operativo",
            "marca",
            "modelo",
            "status",
            "equipo especial",
            "personal retirado transferido",
            "fecha de actualizacion",
            "observaciones",
            "segmento",
            "pcn ene 2026",
            "mem2",
            "dd",
            "distribucion",
            "estatus agencia",
            "dispositivo de conexion",
            "serial dispositivo",
            "sim card",
            "operadora",
            "equipo de proteccion",
            "serial",
            "grupo",
        ]
        rows = []

        for item in items:
            extra = item.get("extra") or {}
            row = [
                extra.get("serial equipo", item.get("serial", "")),
                extra.get("hostname", ""),
                extra.get("ubicacion", item.get("source_sheet", "")),
                extra.get("tipo de equipo", item.get("asset_type", "")),
                extra.get("usuario", item.get("assignee", "")),
                extra.get("carnet", ""),
                extra.get("ext", ""),
                extra.get("cod.", item.get("asset_code", "")),
                extra.get("oficina", item.get("office", "")),
                extra.get("piso region", ""),
                extra.get("cargo ubicacion", ""),
                extra.get("sistema operativo", ""),
                extra.get("marca", ""),
                extra.get("modelo", item.get("model", "")),
                extra.get("status", ""),
                extra.get("equipo especial", ""),
                extra.get("personal retirado transferido", ""),
                extra.get("fecha de actualizacion", ""),
                extra.get("observaciones", ""),
                extra.get("segmento", ""),
                extra.get("pcn ene 2026", ""),
                extra.get("mem2", ""),
                extra.get("dd", ""),
                extra.get("distribucion", ""),
                extra.get("estatus agencia", ""),
                extra.get("dispositivo de conexion", ""),
                extra.get("serial dispositivo", ""),
                extra.get("sim card", ""),
                extra.get("operadora", ""),
                extra.get("equipo de proteccion", ""),
                extra.get("serial", ""),
                extra.get("grupo", ""),
            ]
            rows.append(row)

        return _xlsx_response("INVENTARIO GENERAL PROYECTO ACTUALIZACION TECNOLOGICA MARZO 2026 VF 27-3-2026", headers, rows)


class UsersReportExportView(APIView):
    def get(self, request):
        queryset = _apply_user_filters(_user_base_qs(), request)
        users = [_user_to_payload(user) for user in queryset.order_by("carnet")]
        extra_keys = sorted({k for user in users for k in (user.get("extra") or {}).keys()})

        headers = ["id", "carnet", "name", "cargo_ubicacion", "cargo", "office", "oficina", "distribucion"] + extra_keys
        rows = []

        for user in users:
            extra = user.get("extra") or {}
            row = [
                user.get("id", ""),
                user.get("carnet", ""),
                user.get("name", ""),
                user.get("cargo_ubicacion", ""),
                user.get("cargo", ""),
                user.get("office", ""),
                user.get("oficina", ""),
                user.get("distribucion", ""),
            ] + [extra.get(key, "") for key in extra_keys]
            rows.append(row)

        return _xlsx_response("users_report", headers, rows)
