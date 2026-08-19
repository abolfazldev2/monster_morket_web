from rest_framework import serializers

from apps.products.models import Product

from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_image = serializers.ImageField(source="product.cover_image", read_only=True)
    price = serializers.DecimalField(source="product.base_price", max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_name", "product_slug", "product_image", "price", "created_at"]


class AddWishlistItemSerializer(serializers.Serializer):
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.filter(is_active=True))
