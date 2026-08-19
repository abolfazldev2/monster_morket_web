from django.conf import settings
from django.db import models

from apps.products.models import Product, ProductVariant
from common.models import TimeStampedModel


class Cart(TimeStampedModel):
    """
    A cart belongs to a logged-in user OR a guest session key, never both.
    On login, the guest cart (if any) is merged into the user's cart —
    see services.merge_guest_cart_into_user_cart.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="cart"
    )
    session_key = models.CharField(max_length=64, null=True, blank=True, unique=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(user__isnull=False) | models.Q(session_key__isnull=False),
                name="cart_has_owner",
            )
        ]

    def __str__(self):
        return f"Cart({self.user or self.session_key})"

    @property
    def subtotal(self):
        return sum((item.subtotal for item in self.items.all()), start=0)


class CartItem(TimeStampedModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = [("cart", "product", "variant")]

    @property
    def unit_price(self):
        return self.variant.price if self.variant else self.product.base_price

    @property
    def subtotal(self):
        return self.unit_price * self.quantity
