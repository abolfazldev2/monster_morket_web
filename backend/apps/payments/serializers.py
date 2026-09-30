from django.conf import settings
from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    telegram_contact_url = serializers.SerializerMethodField()
    telegram_app_url = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id", "method", "status", "amount", "currency",
            "telegram_contact_reference", "telegram_contact_url", "telegram_app_url",
            "transaction_reference", "confirmed_at",
        ]

    def get_telegram_contact_url(self, obj):
        username = settings.TELEGRAM_SUPPORT_USERNAME.strip().lstrip("@")
        text = f"Hello, I want to pay for order #{obj.order.order_number}."
        from urllib.parse import quote
        return f"https://t.me/{username}?text={quote(text)}"

    def get_telegram_app_url(self, obj):
        username = settings.TELEGRAM_SUPPORT_USERNAME.strip().lstrip("@")
        text = f"Hello, I want to pay for order #{obj.order.order_number}."
        from urllib.parse import quote
        return f"tg://resolve?domain={username}&text={quote(text)}"


class ConfirmPaymentSerializer(serializers.Serializer):
    transaction_reference = serializers.CharField(max_length=128)
    note = serializers.CharField(required=False, allow_blank=True)
