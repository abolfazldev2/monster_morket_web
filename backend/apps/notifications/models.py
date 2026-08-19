from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Notification(TimeStampedModel):
    class NotificationType(models.TextChoices):
        ORDER_CREATED = "ORDER_CREATED", "Order Created"
        PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED", "Payment Confirmed"
        ORDER_PROCESSING = "ORDER_PROCESSING", "Order Processing"
        ORDER_COMPLETED = "ORDER_COMPLETED", "Order Completed"
        ORDER_CANCELLED = "ORDER_CANCELLED", "Order Cancelled"
        ORDER_REFUNDED = "ORDER_REFUNDED", "Order Refunded"
        ACCOUNT = "ACCOUNT", "Account"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=32, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    related_order = models.ForeignKey(
        "orders.Order", on_delete=models.CASCADE, null=True, blank=True, related_name="notifications"
    )
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "is_read"])]
