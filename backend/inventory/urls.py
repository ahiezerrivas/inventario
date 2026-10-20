from django.urls import path

from .views import (
    CodesListView,
    DashboardSummaryView,
    EquipmentTypesListView,
    InventoryDetailView,
    InventoryListCreateView,
    InventoryReportExportView,
    UserDetailView,
    UsersListView,
    UsersReportExportView,
)

urlpatterns = [
    path("dashboard/summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("inventory/", InventoryListCreateView.as_view(), name="inventory-list-create"),
    path("inventory/<str:item_id>/", InventoryDetailView.as_view(), name="inventory-detail"),
    path("reports/inventory/", InventoryReportExportView.as_view(), name="inventory-report-export"),
    path("reports/users/", UsersReportExportView.as_view(), name="users-report-export"),
    path("codes/", CodesListView.as_view(), name="codes-list"),
    path("equipment-types/", EquipmentTypesListView.as_view(), name="equipment-types-list"),
    path("users/", UsersListView.as_view(), name="users-list"),
    path("users/<str:carnet>/", UserDetailView.as_view(), name="user-detail"),
]
