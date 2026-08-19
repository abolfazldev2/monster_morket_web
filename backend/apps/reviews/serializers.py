from rest_framework import serializers

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = Review
        fields = ["id", "product", "product_name", "username", "rating", "comment", "is_approved", "created_at"]
        read_only_fields = ["id", "username", "product_name", "created_at"]
