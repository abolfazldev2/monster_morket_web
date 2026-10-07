import uuid
import json

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify
from rest_framework import permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from apps.fulfillment.models import Fulfillment
from apps.orders.models import OrderItem
from common.models import AuditLog

from .models import DeliveryMethod, Product


class SellerListingSerializer(serializers.ModelSerializer):
    game_name = serializers.CharField(source="game.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    listing_status = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "game", "game_name", "category", "category_name", "name", "description",
            "base_price", "currency", "cover_image", "wear", "float_value", "rarity",
            "stickers", "pattern_id", "seller_approved", "is_marketplace_listing", "is_active", "listing_status", "created_at",
        ]
        read_only_fields = ["id", "currency", "seller_approved", "is_marketplace_listing", "is_active", "created_at"]

    def get_listing_status(self, obj):
        if obj.seller_approved and obj.is_active:
            return "active"
        if obj.seller_approved:
            return "paused"
        return "pending_review"

    def validate(self, attrs):
        game = attrs.get("game", getattr(self.instance, "game", None))
        category = attrs.get("category", getattr(self.instance, "category", None))
        if game and category and category.game_id != game.id:
            raise serializers.ValidationError({"category": "Choose a category belonging to this game."})
        if game and game.slug not in {"cs2", "dota2"}:
            raise serializers.ValidationError({"game": "User listings are currently supported for CS2 and Dota 2 only."})
        value = attrs.get("float_value", getattr(self.instance, "float_value", None))
        if value is not None and not 0 <= value <= 1:
            raise serializers.ValidationError({"float_value": "Float must be between 0 and 1."})
        if not self.instance and (
            not self.context["request"].user.steam_id64 or not self.context["request"].user.steam_trade_url
        ):
            raise serializers.ValidationError({"steam": "Connect Steam and save your trade URL before creating a listing."})
        return attrs

    def to_internal_value(self, data):
        if hasattr(data, "get") and isinstance(data.get("stickers"), str):
            raw = data.get("stickers", "").strip()
            if raw:
                try:
                    data = data.copy()
                    data["stickers"] = json.loads(raw)
                except (TypeError, ValueError):
                    data = data.copy()
                    data["stickers"] = [part.strip() for part in raw.split(",") if part.strip()]
            else:
                data = data.copy()
                data["stickers"] = []
        return super().to_internal_value(data)

    def create(self, validated_data):
        seller = self.context["request"].user
        base = slugify(validated_data["name"])[:150] or "item"
        validated_data.update(
            seller=seller,
            is_marketplace_listing=True,
            seller_approved=False,
            is_active=False,
            stock=1,
            product_type="steam_item",
            delivery_method=DeliveryMethod.STEAM_TRADE,
            slug=f"{base}-{uuid.uuid4().hex[:10]}",
        )
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Any material edit sends a listing back to moderation.
        instance = super().update(instance, validated_data)
        instance.seller_approved = False
        instance.is_active = False
        instance.save(update_fields=["seller_approved", "is_active", "updated_at"])
        return instance


class SellerSaleSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    order_status = serializers.CharField(source="order.status", read_only=True)
    buyer_name = serializers.CharField(source="order.user.username", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    fulfillment_status = serializers.CharField(source="fulfillment.status", read_only=True)
    buyer_steam_id64 = serializers.CharField(source="fulfillment.steam_id64", read_only=True)
    buyer_trade_url = serializers.CharField(source="fulfillment.steam_trade_url", read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id", "order_number", "order_status", "buyer_name", "product_name", "quantity",
            "unit_price", "fulfillment_status", "buyer_steam_id64", "buyer_trade_url", "created_at",
        ]


class SellerListingViewSet(viewsets.ModelViewSet):
    serializer_class = SellerListingSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        return Product.objects.filter(seller=self.request.user).select_related("game", "category")

    def perform_destroy(self, instance):
        # Preserve order history and references; deletion is an unpublish.
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])


class SellerSaleViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = SellerSaleSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = OrderItem.objects.none()

    def get_queryset(self):
        return OrderItem.objects.filter(
            product__seller=self.request.user,
            order__status__in=["PAID", "PROCESSING", "COMPLETED"],
        ).select_related("order", "order__user", "product", "fulfillment")

    @action(detail=True, methods=["post"], url_path="mark-delivered")
    @transaction.atomic
    def mark_delivered(self, request, pk=None):
        item = self.get_object()
        fulfillment = Fulfillment.objects.select_for_update().get(order_item=item)
        if fulfillment.status != Fulfillment.Status.WAITING_TRADE:
            raise ValidationError({"detail": "The order must be ready for a Steam trade before delivery can be confirmed."})
        fulfillment.status = Fulfillment.Status.DELIVERED
        fulfillment.delivered_at = timezone.now()
        fulfillment.save(update_fields=["status", "delivered_at"])
        item.fulfillment = fulfillment
        AuditLog.record(
            user=request.user,
            action="seller_marked_delivered",
            target=fulfillment,
            old_value={"status": Fulfillment.Status.WAITING_TRADE},
            new_value={"status": Fulfillment.Status.DELIVERED},
        )
        return Response(self.get_serializer(item).data, status=status.HTTP_200_OK)
