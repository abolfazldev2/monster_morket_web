import uuid

from django.conf import settings
from django.db import models

from apps.products.models import Product, ProductVariant
from common.models import TimeStampedModel


class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        WAITING_FOR_PAYMENT = "WAITING_FOR_PAYMENT", "Waiting for Payment"
        PAID = "PAID", "Paid"
        PROCESSING = "PROCESSING", "Processing"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"
        REFUNDED = "REFUNDED", "Refunded"

    order_number = models.CharField(max_length=32, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=32, choices=Status.choices, default=Status.PENDING)

    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=8, default="USD")
    coupon = models.ForeignKey("coupons.Coupon", null=True, blank=True, on_delete=models.SET_NULL)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["order_number"]),
            models.Index(fields=["user", "-created_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.order_number:
            self.order_number = f"MM-{uuid.uuid4().int % 100000:05d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.order_number


class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    # snapshot of the answers to the product's ProductRequiredField set at purchase time
    customer_data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.order.order_number}: {self.product.name} x{self.quantity}"


class OrderAdminNote(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="admin_notes")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    note = models.TextField()

    class Meta:
        ordering = ["-created_at"]
