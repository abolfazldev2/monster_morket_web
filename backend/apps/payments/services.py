from django.db import transaction
from django.utils import timezone

from apps.orders.models import Order
from common.models import AuditLog

from .models import Payment


@transaction.atomic
def confirm_payment(payment: Payment, admin_user, transaction_reference="", ip_address=None, note=""):
    payment = Payment.objects.select_for_update().get(pk=payment.pk)
    if payment.status != Payment.Status.WAITING_FOR_PAYMENT:
        raise ValueError("Only payments waiting for payment can be confirmed.")
    old_status = payment.status
    payment.status = Payment.Status.PAYMENT_RECEIVED
    payment.transaction_reference = transaction_reference.strip()
    payment.confirmed_by = admin_user
    payment.confirmed_at = timezone.now()
    payment.save(update_fields=["status", "transaction_reference", "confirmed_by", "confirmed_at"])

    order = Order.objects.select_for_update().get(pk=payment.order_id)
    old_order_status = order.status
    order.status = Order.Status.PAID
    order.save(update_fields=["status"])

    AuditLog.record(
        user=admin_user, action="confirm_payment", target=payment,
        old_value={"status": old_status}, new_value={"status": payment.status, "note": note},
        ip_address=ip_address,
    )
    AuditLog.record(
        user=admin_user, action="order_status_change", target=order,
        old_value={"status": old_order_status}, new_value={"status": order.status},
        ip_address=ip_address,
    )

    from apps.fulfillment.models import Fulfillment
    fulfillments = Fulfillment.objects.filter(
        order_item__order=order,
        status=Fulfillment.Status.WAITING_FOR_PAYMENT,
    )
    for fulfillment in fulfillments:
        fulfillment.status = Fulfillment.Status.PAID
        fulfillment.save(update_fields=["status"])

    from apps.notifications.services import notify_payment_confirmed
    transaction.on_commit(lambda: notify_payment_confirmed(order))
    from apps.notifications.services import notify_order_status_changed
    transaction.on_commit(lambda: notify_order_status_changed(order))

    return payment
