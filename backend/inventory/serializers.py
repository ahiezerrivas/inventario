from rest_framework import serializers


class InventoryItemSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    source_sheet = serializers.ChoiceField(choices=["Global", "Sede", "Oficina"])
    asset_code = serializers.CharField(required=False, allow_blank=True)
    asset_type = serializers.CharField(required=False, allow_blank=True)
    model = serializers.CharField(required=False, allow_blank=True)
    serial = serializers.CharField(required=False, allow_blank=True)
    assignee = serializers.CharField(required=False, allow_blank=True)
    office = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)
    extra = serializers.DictField(required=False)


class UserSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    carnet = serializers.CharField()
    name = serializers.CharField(required=False, allow_blank=True)
    cargo_ubicacion = serializers.CharField(required=False, allow_blank=True)
    office = serializers.CharField(required=False, allow_blank=True)
    oficina = serializers.CharField(required=False, allow_blank=True)
    distribucion = serializers.CharField(required=False, allow_blank=True)
    cargo = serializers.CharField(required=False, allow_blank=True)
    extra = serializers.DictField(required=False)
