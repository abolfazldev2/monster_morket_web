from rest_framework import serializers

from apps.fulfillment.serializers import FulfillmentSerializer
from apps.payments.serializers import PaymentSerializer

from .models import Order, OrderAdminNote, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    game = serializers.CharField(source="product.game.slug", read_only=True)
    fulfillment = FulfillmentSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "product", "product_name", "game", "variant", "quantity",
            "unit_price", "subtotal", "customer_data", "fulfillment",
        ]


class OrderAdminNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = OrderAdminNote
        fields = ["id", "author_name", "note", "created_at"]


class OrderListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ["id", "order_number", "status", "total", "currency", "created_at"]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)
    customer_username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Order
        fields = [
            "id", "order_number", "customer_username", "status", "subtotal",
            "discount_amount", "total", "currency", "items", "payment", "created_at",
        ]


class CreateOrderSerializer(serializers.Serializer):
    """items_customer_data maps cart_item_id (str) -> {field_key: value}."""
    items_customer_data = serializers.DictField(child=serializers.DictField(), required=False)
    coupon_code = serializers.CharField(required=False, allow_blank=True)
