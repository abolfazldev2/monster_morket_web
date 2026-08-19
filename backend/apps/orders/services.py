from django.core.exceptions import ValidationError
from django.db import models, transaction

from apps.fulfillment.models import Fulfillment
from apps.payments.models import Payment

from .models import Order, OrderItem


def _validate_customer_data(product, customer_data: dict):
    """Every is_required ProductRequiredField must have a non-empty answer."""
    for field in product.required_fields.all():
        if field.is_required and not customer_data.get(field.field_key):
            raise ValidationError(f"Missing required field '{field.label}' for {product.name}.")
    return customer_data


@transaction.atomic
def create_order_from_cart(cart, user, items_customer_data: dict, coupon_code: str = ""):
    """
    items_customer_data: {cart_item_id: {field_key: value, ...}, ...}
    Snapshots product-required-field answers onto each OrderItem so that a
    later product edit never changes what was actually purchased/recorded.
    """
    cart_items = list(cart.items.select_related("product", "variant"))
    if not cart_items:
        raise ValidationError("Cart is empty.")

    subtotal = sum((item.subtotal for item in cart_items), start=0)

    coupon = None
    discount_amount = 0
    if coupon_code:
        from apps.coupons.models import Coupon

        coupon = Coupon.objects.filter(code__iexact=coupon_code).first()
        if not coupon or not coupon.is_valid():
            raise ValidationError("Coupon is invalid or expired.")
        discount_amount = coupon.compute_discount(subtotal)

    order = Order.objects.create(
        user=user,
        status=Order.Status.PENDING,
        subtotal=subtotal,
        discount_amount=discount_amount,
        total=subtotal - discount_amount,
        currency="USD",
        coupon=coupon,
    )

    if coupon:
        coupon.times_used = models.F("times_used") + 1
        coupon.save(update_fields=["times_used"])

    for cart_item in cart_items:
        customer_data = items_customer_data.get(str(cart_item.id), {})
        _validate_customer_data(cart_item.product, customer_data)

        order_item = OrderItem.objects.create(
            order=order,
            product=cart_item.product,
            variant=cart_item.variant,
            quantity=cart_item.quantity,
            unit_price=cart_item.unit_price,
            subtotal=cart_item.subtotal,
            customer_data=customer_data,
        )

        Fulfillment.objects.create(
            order_item=order_item,
            delivery_method=cart_item.product.delivery_method,
            status=Fulfillment.Status.PENDING,
            steam_profile_url=customer_data.get("steam_profile_url", ""),
        )

    Payment.objects.create(
        order=order,
        method=Payment.Method.TELEGRAM,
        status=Payment.Status.WAITING_FOR_PAYMENT,
        amount=order.total,
        currency=order.currency,
    )
    order.status = Order.Status.WAITING_FOR_PAYMENT
    order.save(update_fields=["status"])

    cart.items.all().delete()

    from apps.notifications.services import notify_order_created
    notify_order_created(order)

    return order


@transaction.atomic
def transition_order_status(order: Order, new_status: str, actor):
    old_status = order.status
    order.status = new_status
    order.save(update_fields=["status"])

    from common.models import AuditLog
    AuditLog.record(
        user=actor, action="order_status_change", target=order,
        old_value={"status": old_status}, new_value={"status": new_status},
    )

    from apps.notifications.services import notify_order_status_changed
    notify_order_status_changed(order)
    return order
