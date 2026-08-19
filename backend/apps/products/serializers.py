from rest_framework import serializers

from .models import Product, ProductRequiredField, ProductVariant


class ProductRequiredFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductRequiredField
        fields = [
            "field_key", "label", "field_type", "is_required",
            "validation_regex", "options", "sort_order",
        ]


class ProductVariantSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = ProductVariant
        fields = ["id", "name", "price", "stock", "sort_order"]


class ProductListSerializer(serializers.ModelSerializer):
    game = serializers.CharField(source="game.slug", read_only=True)
    category = serializers.CharField(source="category.slug", read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "game", "category", "base_price", "currency",
            "cover_image", "is_featured", "is_best_seller", "in_stock",
        ]

    def get_name(self, obj):
        """Returns the translated name for the requested language, falling back to en."""
        lang = self.context.get("language_code", "en")
        translation = next((t for t in obj.translations.all() if t.language_code == lang), None)
        return translation.name if translation else obj.name


class ProductDetailSerializer(serializers.ModelSerializer):
    game = serializers.CharField(source="game.slug", read_only=True)
    category = serializers.CharField(source="category.slug", read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    required_fields = ProductRequiredFieldSerializer(many=True, read_only=True)
    name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "description", "game", "category", "product_type",
            "base_price", "currency", "in_stock", "delivery_method", "cover_image",
            "variants", "required_fields",
        ]

    def _translation(self, obj):
        lang = self.context.get("language_code", "en")
        return next((t for t in obj.translations.all() if t.language_code == lang), None)

    def get_name(self, obj):
        t = self._translation(obj)
        return t.name if t else obj.name

    def get_description(self, obj):
        t = self._translation(obj)
        return t.description if t and t.description else obj.description
