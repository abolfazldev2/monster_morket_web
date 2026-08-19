from django.db import transaction
from django.utils import timezone

from apps.orders.models import Order
from common.models import AuditLog

from .models import Payment


@transaction.atomic
def confirm_payment(payment: Payment, admin_user, ip_address=None, note=""):
    old_status = payment.status
    payment.status = Payment.Status.PAYMENT_RECEIVED
    payment.confirmed_by = admin_user
    payment.confirmed_at = timezone.now()
    payment.save(update_fields=["status", "confirmed_by", "confirmed_at"])

    order = payment.order
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

    # move straight into PROCESSING — fulfillment queue picks it up
    order.status = Order.Status.PROCESSING
    order.save(update_fields=["status"])

    from apps.notifications.services import notify_payment_confirmed
    notify_payment_confirmed(order)

    return payment
