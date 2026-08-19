from django.conf import settings
from django.db import models

from apps.products.models import DeliveryMethod
from common.models import TimeStampedModel


class Fulfillment(TimeStampedModel):
    """
    One per OrderItem. Steam-delivered items use the full status superset
    (friend request / trade cooldown states); GAME_CODE and
    MANUAL_ACTIVATION products only ever move through the reduced subset
    (PENDING -> PROCESSING -> DELIVERED -> COMPLETED) — see
    delivery_methods/ for which states each strategy exposes to the admin UI.
    NEVER stores Steam passwords, Steam Guard codes, or any credentials —
    only public profile identifiers.
    """

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        WAITING_FOR_PAYMENT = "WAITING_FOR_PAYMENT", "Waiting for Payment"
        PAID = "PAID", "Paid"
        PROCESSING = "PROCESSING", "Processing"
        STEAM_FRIEND_REQUESTED = "STEAM_FRIEND_REQUESTED", "Steam Friend Requested"
        WAITING_TRADE = "WAITING_TRADE", "Waiting Trade"
        DELIVERED = "DELIVERED", "Delivered"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        REFUNDED = "REFUNDED", "Refunded"

    order_item = models.OneToOneField(
        "orders.OrderItem", on_delete=models.CASCADE, related_name="fulfillment"
    )
    delivery_method = models.CharField(max_length=32, choices=DeliveryMethod.choices)
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING)
    assigned_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="fulfillments"
    )

    # public Steam identifiers only — never credentials
    steam_profile_url = models.CharField(max_length=200, blank=True)
    steam_id64 = models.CharField(max_length=17, blank=True)

    delivery_data = models.JSONField(default=dict, blank=True, help_text="e.g. issued game code")

    friend_requested_at = models.DateTimeField(null=True, blank=True)
    trade_ready_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [models.Index(fields=["status"]), models.Index(fields=["assigned_admin"])]

    def __str__(self):
        return f"Fulfillment({self.order_item}: {self.status})"


class FulfillmentNote(TimeStampedModel):
    fulfillment = models.ForeignKey(Fulfillment, on_delete=models.CASCADE, related_name="notes")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    note = models.TextField()

    class Meta:
        ordering = ["-created_at"]
