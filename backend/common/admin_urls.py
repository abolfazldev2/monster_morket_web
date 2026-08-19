from django.urls import path
from rest_framework.routers import DefaultRouter

from .admin_views import AuditLogViewSet, DashboardReportView

router = DefaultRouter()
router.register("audit-logs", AuditLogViewSet, basename="admin-audit-log")

urlpatterns = router.urls + [
    path("reports/overview/", DashboardReportView.as_view(), name="admin-reports-overview"),
]
