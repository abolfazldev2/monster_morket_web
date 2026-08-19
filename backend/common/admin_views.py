from datetime import timedelta

from django.db.models import Count, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import serializers, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.fulfillment.models import Fulfillment
from apps.orders.models import Order
from apps.products.models import Product
from apps.users.models import User

from .models import AuditLog
from .permissions import IsAnyAdmin, IsSuperAdmin


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True, allow_null=True)

    class Meta:
        model = AuditLog
        fields = ["id", "username", "action", "target_model", "target_id", "old_value", "new_value", "created_at"]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only — audit history must never be editable, even by admins."""

    queryset = AuditLog.objects.select_related("user")
    serializer_class = AuditLogSerializer
    permission_classes = [IsSuperAdmin]
    filterset_fields = ["action", "target_model"]


class DashboardReportView(APIView):
    """
    Powers the admin overview charts: sales over time, orders over time,
    top products, sales by game, pending fulfillment by status.
    """

    permission_classes = [IsAnyAdmin]

    def get(self, request):
        since = timezone.now() - timedelta(days=30)

        sales_over_time = list(
            Order.objects.filter(status=Order.Status.COMPLETED, created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(total=Sum("total"), count=Count("id"))
            .order_by("day")
        )

        orders_over_time = list(
            Order.objects.filter(created_at__gte=since)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        top_products = list(
            Order.objects.filter(status=Order.Status.COMPLETED)
            .values("items__product__name")
            .annotate(total_sold=Sum("items__quantity"))
            .exclude(items__product__isnull=True)
            .order_by("-total_sold")[:5]
        )

        sales_by_game = list(
            Order.objects.filter(status=Order.Status.COMPLETED)
            .values("items__product__game__name")
            .annotate(total=Sum("items__subtotal"))
            .exclude(items__product__game__isnull=True)
            .order_by("-total")
        )

        pending_fulfillment = list(
            Fulfillment.objects.exclude(status__in=[Fulfillment.Status.COMPLETED, Fulfillment.Status.CANCELLED])
            .values("status")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        return Response(
            {
                "total_sales": Order.objects.filter(status=Order.Status.COMPLETED).aggregate(s=Sum("total"))["s"] or 0,
                "today_sales": Order.objects.filter(
                    status=Order.Status.COMPLETED, created_at__date=timezone.now().date()
                ).aggregate(s=Sum("total"))["s"] or 0,
                "total_orders": Order.objects.count(),
                "pending_orders": Order.objects.filter(
                    status__in=[Order.Status.PENDING, Order.Status.WAITING_FOR_PAYMENT, Order.Status.PAID, Order.Status.PROCESSING]
                ).count(),
                "pending_payments": Order.objects.filter(status=Order.Status.WAITING_FOR_PAYMENT).count(),
                "active_products": Product.objects.filter(is_active=True).count(),
                "registered_users": User.objects.filter(role=User.Role.CUSTOMER).count(),
                "sales_over_time": sales_over_time,
                "orders_over_time": orders_over_time,
                "top_products": top_products,
                "sales_by_game": sales_by_game,
                "pending_fulfillment": pending_fulfillment,
            }
        )
