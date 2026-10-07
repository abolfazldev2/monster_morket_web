from django.core.exceptions import ValidationError
from django.db import models, transaction
import re
from collections import defaultdict

from apps.fulfillment.models import Fulfillment
from apps.payments.models import Payment
from apps.products.models import DeliveryMethod, Product, ProductVariant

from .models import Order, OrderItem


def _validate_customer_data(product, customer_data: dict):
    """Validate submitted values against the product's current field definitions."""
    fields = {field.field_key: field for field in product.required_fields.all()}
    unknown_fields = set(customer_data) - set(fields)
    if unknown_fields:
        raise ValidationError(f"Unknown customer field(s) for {product.name}: {', '.join(sorted(unknown_fields))}.")

    for field in product.required_fields.all():
        value = customer_data.get(field.field_key, "")
        if not isinstance(value, str):
            raise ValidationError(f"Field '{field.label}' must be text.")
        value = value.strip()
        if field.is_required and not value:
            raise ValidationError(f"Missing required field '{field.label}' for {product.name}.")
        if value and field.validation_regex and not re.fullmatch(field.validation_regex, value):
            raise ValidationError(f"Field '{field.label}' has an invalid format.")
        if value and field.field_type == field.FieldType.SELECT:
            options = field.options or []
            allowed = {str(option.get("value")) for option in options if isinstance(option, dict) and "value" in option}
            if value not in allowed:
                raise ValidationError(f"Choose a valid option for '{field.label}'.")
        if field.field_key in customer_data:
            customer_data[field.field_key] = value
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

    products = Product.objects.select_for_update().filter(
        id__in={item.product_id for item in cart_items}
    ).in_bulk()
    variants = ProductVariant.objects.select_for_update().filter(
        id__in={item.variant_id for item in cart_items if item.variant_id}
    ).in_bulk()
    product_quantities = defaultdict(int)
    for item in cart_items:
        item.product = products[item.product_id]
        item.variant = variants.get(item.variant_id) if item.variant_id else None
        if not item.product.is_active:
            raise ValidationError(f"{item.product.name} is no longer available.")
        product_quantities[item.product_id] += item.quantity
        if item.variant_id and item.variant is None:
            raise ValidationError(f"A selected variant for {item.product.name} is no longer available.")
        if item.variant and item.variant.stock is not None and item.quantity > item.variant.stock:
            raise ValidationError(f"Insufficient stock for {item.product.name} ({item.variant.name}).")
        if item.product.seller_id and (not user.steam_id64 or not user.steam_trade_url):
            raise ValidationError("Connect Steam and save your trade URL before buying a user-listed item.")
        if item.product.seller_id == user.pk:
            raise ValidationError("You cannot purchase your own listing.")
    for product_id, quantity in product_quantities.items():
        product = products[product_id]
        if product.stock is not None and quantity > product.stock:
            raise ValidationError(f"Insufficient stock for {product.name}.")

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
        customer_data = dict(items_customer_data.get(str(cart_item.id), {}))
        linked_profile_url = f"https://steamcommunity.com/profiles/{user.steam_id64}" if user.steam_id64 else ""
        submitted_profile = customer_data.get("steam_profile_url", "")
        if isinstance(submitted_profile, str):
            submitted_profile = submitted_profile.strip()
        uses_linked_steam = bool(
            linked_profile_url
            and submitted_profile in {"", linked_profile_url}
        )
        if (
            uses_linked_steam
            and cart_item.product.delivery_method in {DeliveryMethod.STEAM_TRADE, DeliveryMethod.STEAM_GIFT}
            and "steam_profile_url" in {field.field_key for field in cart_item.product.required_fields.all()}
            and not customer_data.get("steam_profile_url")
        ):
            customer_data["steam_profile_url"] = linked_profile_url
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
            status=Fulfillment.Status.WAITING_FOR_PAYMENT,
            steam_profile_url=customer_data.get("steam_profile_url", ""),
            steam_id64=user.steam_id64 if uses_linked_steam and cart_item.product.delivery_method in {DeliveryMethod.STEAM_TRADE, DeliveryMethod.STEAM_GIFT} else "",
            steam_trade_url=user.steam_trade_url if uses_linked_steam and cart_item.product.delivery_method == DeliveryMethod.STEAM_TRADE else "",
        )

        if cart_item.product.stock is not None:
            cart_item.product.stock -= cart_item.quantity
            cart_item.product.save(update_fields=["stock"])
        if cart_item.variant and cart_item.variant.stock is not None:
            cart_item.variant.stock -= cart_item.quantity
            cart_item.variant.save(update_fields=["stock"])

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
    transaction.on_commit(lambda: notify_order_created(order))

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


@transaction.atomic
def cancel_unpaid_order(order: Order, actor, ip_address=None):
    """Cancel an unpaid order and return its reserved inventory exactly once."""
    # Avoid joining the nullable coupon relation while locking: PostgreSQL
    # rejects FOR UPDATE on the nullable side of an outer join.
    order = Order.objects.select_for_update().get(pk=order.pk)
    payment = Payment.objects.select_for_update().get(order=order)
    if order.status != Order.Status.WAITING_FOR_PAYMENT or payment.status != Payment.Status.WAITING_FOR_PAYMENT:
        raise ValueError("Only orders waiting for payment can be cancelled.")

    old_order_status = order.status
    order.status = Order.Status.CANCELLED
    order.save(update_fields=["status"])
    payment.status = Payment.Status.CANCELLED
    payment.save(update_fields=["status"])

    from apps.fulfillment.models import Fulfillment
    for fulfillment in Fulfillment.objects.select_for_update().filter(order_item__order=order):
        fulfillment.status = Fulfillment.Status.CANCELLED
        fulfillment.save(update_fields=["status"])

    for item in order.items.select_related("product", "variant"):
        product = Product.objects.select_for_update().get(pk=item.product_id)
        if product.stock is not None:
            product.stock += item.quantity
            product.save(update_fields=["stock"])
        if item.variant_id:
            variant = ProductVariant.objects.select_for_update().get(pk=item.variant_id)
            if variant.stock is not None:
                variant.stock += item.quantity
                variant.save(update_fields=["stock"])

    if order.coupon_id:
        from apps.coupons.models import Coupon
        Coupon.objects.filter(pk=order.coupon_id, times_used__gt=0).update(times_used=models.F("times_used") - 1)

    from common.models import AuditLog
    AuditLog.record(
        user=actor, action="cancel_unpaid_order", target=order,
        old_value={"status": old_order_status}, new_value={"status": order.status},
        ip_address=ip_address,
    )
    from apps.notifications.services import notify_order_status_changed
    transaction.on_commit(lambda: notify_order_status_changed(order))
    return order
