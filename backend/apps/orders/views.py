from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from apps.cart.services import get_or_create_cart
from common.permissions import IsAnyAdmin

from .models import Order
from .serializers import CreateOrderSerializer, OrderDetailSerializer, OrderListSerializer
from .services import create_order_from_cart


class OrderViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "head"]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Order.objects.select_related("user").prefetch_related("items")
        if self.request.user.role in {"SUPPORT", "FULFILLMENT_ADMIN", "SUPER_ADMIN"}:
            return qs
        return qs.filter(user=self.request.user)

    def get_serializer_class(self):
        if self.action == "list":
            return OrderListSerializer
        return OrderDetailSerializer

    def get_throttles(self):
        if self.action == "create":
            self.throttle_scope = "order_create"
            return [ScopedRateThrottle()]
        return super().get_throttles()

    def create(self, request, *args, **kwargs):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_or_create_cart(request)
        try:
            order = create_order_from_cart(
                cart, request.user,
                serializer.validated_data.get("items_customer_data", {}),
                coupon_code=serializer.validated_data.get("coupon_code", ""),
            )
        except DjangoValidationError as exc:
            raise ValidationError(exc.message if hasattr(exc, "message") else str(exc))
        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)

    def get_lookup(self):
        return "order_number"

    def retrieve(self, request, *args, **kwargs):
        order = self.get_queryset().filter(order_number=kwargs.get("pk")).first()
        if not order:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(OrderDetailSerializer(order).data)
