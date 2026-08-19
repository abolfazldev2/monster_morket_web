from rest_framework import serializers, viewsets

from common.permissions import IsAnyAdmin

from .models import Product, ProductRequiredField, ProductTranslation, ProductVariant


class AdminProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ["id", "name", "price_override", "stock", "sort_order"]


class AdminProductRequiredFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRequiredField
        fields = [
            "id", "field_key", "label", "field_type", "is_required",
            "validation_regex", "options", "sort_order",
        ]


class AdminProductTranslationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductTranslation
        fields = ["id", "language_code", "name", "description"]


class AdminProductSerializer(serializers.ModelSerializer):
    variants = AdminProductVariantSerializer(many=True, read_only=True)
    required_fields = AdminProductRequiredFieldSerializer(many=True, read_only=True)
    translations = AdminProductTranslationSerializer(many=True, read_only=True)
    game_name = serializers.CharField(source="game.name", read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "game", "game_name", "category", "category_name", "name", "slug",
            "description", "product_type", "base_price", "currency", "stock",
            "is_active", "delivery_method", "cover_image", "is_featured",
            "is_best_seller", "variants", "required_fields", "translations",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AdminProductViewSet(viewsets.ModelViewSet):
    """Full CRUD for products — SUPER_ADMIN/FULFILLMENT_ADMIN/SUPPORT only."""

    queryset = Product.objects.select_related("game", "category").prefetch_related(
        "variants", "required_fields", "translations"
    )
    serializer_class = AdminProductSerializer
    permission_classes = [IsAnyAdmin]
    filterset_fields = ["game", "category", "is_active"]

    def perform_update(self, serializer):
        from common.models import AuditLog

        old_price = serializer.instance.base_price
        old_stock = serializer.instance.stock
        instance = serializer.save()
        if old_price != instance.base_price or old_stock != instance.stock:
            AuditLog.record(
                user=self.request.user, action="product_update", target=instance,
                old_value={"base_price": str(old_price), "stock": old_stock},
                new_value={"base_price": str(instance.base_price), "stock": instance.stock},
            )
