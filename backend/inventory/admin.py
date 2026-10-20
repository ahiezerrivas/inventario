from django.contrib import admin
from .models import InventoryItem, User
from django.db.models import Q
from django.utils.safestring import mark_safe



@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "source_sheet",
        "asset_type",
        "model",
        "serial",
        "assignee",
        "office",
        "status",
        "imported_at",
    )
    
    list_filter = (
        
        "source_sheet",
        "asset_type",
        "status"
    )
    search_fields = ("serial", "asset_code", "assignee", "office", "model")
    ordering = ("-id",)

   
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "carnet",
        "name",
        "cargo_ubicacion",
        "office",
        "distribucion",
    )
    search_fields = ("carnet", "name", "office", "oficina", "cargo")
    ordering = ("carnet",)