from rest_framework import serializers

from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = [
            "id", "code", "discount_type", "value", "min_order_amount", "is_active",
            "max_uses", "times_used", "valid_from", "valid_until",
        ]
        read_only_fields = ["id", "times_used"]


class ApplyCouponSerializer(serializers.Serializer):
    code = serializers.CharField()
