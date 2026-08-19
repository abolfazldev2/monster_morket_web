from rest_framework import serializers

from .delivery_methods import get_strategy
from .models import Fulfillment, FulfillmentNote


class FulfillmentNoteSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = FulfillmentNote
        fields = ["id", "author_name", "note", "created_at"]


class FulfillmentSerializer(serializers.ModelSerializer):
    notes = FulfillmentNoteSerializer(many=True, read_only=True)
    assigned_admin_name = serializers.CharField(source="assigned_admin.username", read_only=True)
    available_actions = serializers.SerializerMethodField()

    class Meta:
        model = Fulfillment
        fields = [
            "id", "delivery_method", "status", "assigned_admin", "assigned_admin_name",
            "steam_profile_url", "steam_id64", "delivery_data",
            "friend_requested_at", "trade_ready_at", "delivered_at", "completed_at",
            "notes", "available_actions", "created_at",
        ]

    def get_available_actions(self, obj):
        return get_strategy(obj.delivery_method).get_admin_actions()


class FulfillmentAdminListSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order_item.order.order_number", read_only=True)
    customer_username = serializers.CharField(source="order_item.order.user.username", read_only=True)
    product_name = serializers.CharField(source="order_item.product.name", read_only=True)

    class Meta:
        model = Fulfillment
        fields = [
            "id", "order_number", "customer_username", "product_name",
            "delivery_method", "status", "assigned_admin", "created_at",
        ]


class AddNoteSerializer(serializers.Serializer):
    note = serializers.CharField()


class AssignAdminSerializer(serializers.Serializer):
    admin_id = serializers.IntegerField()
