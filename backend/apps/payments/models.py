from django.conf import settings
from django.db import models

from common.models import TimeStampedModel


class Payment(TimeStampedModel):
    """
    v1 has exactly one method (Telegram, manual admin confirmation) but the
    'method' field exists precisely so a real gateway can be added later
    without altering the Order/Payment relationship or state machine.
    """

    class Method(models.TextChoices):
        TELEGRAM = "TELEGRAM", "Telegram (manual)"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        WAITING_FOR_PAYMENT = "WAITING_FOR_PAYMENT", "Waiting for Payment"
        PAYMENT_RECEIVED = "PAYMENT_RECEIVED", "Payment Received"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"
        CANCELLED = "CANCELLED", "Cancelled"

    order = models.OneToOneField("orders.Order", on_delete=models.CASCADE, related_name="payment")
    method = models.CharField(max_length=32, choices=Method.choices, default=Method.TELEGRAM)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=8, default="USD")
    telegram_contact_reference = models.CharField(max_length=64, blank=True)
    transaction_reference = models.CharField(max_length=128, blank=True)
    confirmed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="confirmed_payments"
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Payment({self.order.order_number}: {self.status})"
