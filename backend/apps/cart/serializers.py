from rest_framework import serializers

from apps.products.models import Product, ProductVariant

from .models import Cart, CartItem


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_image = serializers.ImageField(source="product.cover_image", read_only=True)
    game = serializers.CharField(source="product.game.slug", read_only=True)
    variant_name = serializers.CharField(source="variant.name", read_only=True, allow_null=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = [
            "id", "product", "product_name", "product_slug", "product_image", "game",
            "variant", "variant_name", "quantity", "unit_price", "subtotal",
        ]

    def validate(self, attrs):
        product = attrs.get("product") or getattr(self.instance, "product", None)
        variant = attrs.get("variant")
        if variant and variant.product_id != product.id:
            raise serializers.ValidationError("Variant does not belong to this product.")
        return attrs


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "subtotal"]


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))
    variant_id = serializers.PrimaryKeyRelatedField(
        queryset=ProductVariant.objects.all(), required=False, allow_null=True
    )
    quantity = serializers.IntegerField(min_value=1, default=1)

    def validate(self, attrs):
        product = attrs["product_id"]
        variant = attrs.get("variant_id")
        if variant and variant.product_id != product.id:
            raise serializers.ValidationError({"variant_id": "Variant does not belong to this product."})
        return attrs


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)
