from django.db import models


class InventoryItem(models.Model):
	source_sheet = models.CharField(max_length=20)
	asset_code = models.CharField(max_length=255, blank=True)
	asset_type = models.CharField(max_length=255, blank=True)
	model = models.CharField(max_length=255, blank=True)
	serial = models.CharField(max_length=255, blank=True)
	assignee = models.CharField(max_length=255, blank=True)
	office = models.CharField(max_length=255, blank=True)
	status = models.CharField(max_length=100, blank=True)
	extra = models.JSONField(default=dict)
	imported_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		indexes = [
			models.Index(fields=["source_sheet"]),
			models.Index(fields=["serial"]),
			models.Index(fields=["asset_code"]),
		]
		verbose_name = "Inventario"
		verbose_name_plural = "Inventario"

	def __str__(self) -> str:
		return f"{self.source_sheet} | {self.asset_type or 'N/A'} | {self.serial or 'N/A'}"


class User(models.Model):
	carnet = models.CharField(max_length=255, unique=True)
	name = models.CharField(max_length=255, blank=True)
	cargo_ubicacion = models.CharField(max_length=255, blank=True)
	office = models.CharField(max_length=255, blank=True)
	oficina = models.CharField(max_length=255, blank=True)
	distribucion = models.CharField(max_length=255, blank=True)
	cargo = models.CharField(max_length=255, blank=True)
	extra = models.JSONField(default=dict)

	class Meta:
		indexes = [
			models.Index(fields=["carnet"]),
		]
		verbose_name = "Usuario"
		verbose_name_plural = "Usuarios"

	def __str__(self) -> str:
		return f"{self.carnet} | {self.name or 'N/A'}"
