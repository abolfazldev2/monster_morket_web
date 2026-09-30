import logging

from .models import Notification
from .tasks import create_notification_task

logger = logging.getLogger(__name__)


def _dispatch_notification(*args):
    try:
        create_notification_task.delay(*args)
    except Exception:
        logger.exception("Could not enqueue notification; creating it synchronously.")
        try:
            create_notification_task.run(*args)
        except Exception:
            logger.exception("Could not create notification synchronously.")

_STATUS_COPY = {
    "PAID": ("Payment confirmed", "We've confirmed your payment for order {order}."),
    "PROCESSING": ("Order is processing", "We're preparing order {order} for delivery."),
    "COMPLETED": ("Order completed", "Order {order} has been delivered. Enjoy!"),
    "CANCELLED": ("Order cancelled", "Order {order} was cancelled."),
    "REFUNDED": ("Order refunded", "Order {order} has been refunded."),
}


def notify_order_created(order):
    _dispatch_notification(
        order.user_id,
        Notification.NotificationType.ORDER_CREATED,
        f"Order {order.order_number} created",
        f"Your order is waiting for payment. Total: {order.total} {order.currency}.",
        order.id,
    )


def notify_payment_confirmed(order):
    _dispatch_notification(
        order.user_id,
        Notification.NotificationType.PAYMENT_CONFIRMED,
        "Payment confirmed",
        f"We've confirmed your payment for order {order.order_number}.",
        order.id,
    )


def notify_order_status_changed(order):
    copy = _STATUS_COPY.get(order.status)
    if not copy:
        return
    title, template = copy
    type_map = {
        "PROCESSING": Notification.NotificationType.ORDER_PROCESSING,
        "COMPLETED": Notification.NotificationType.ORDER_COMPLETED,
        "CANCELLED": Notification.NotificationType.ORDER_CANCELLED,
        "REFUNDED": Notification.NotificationType.ORDER_REFUNDED,
        "PAID": Notification.NotificationType.PAYMENT_CONFIRMED,
    }
    _dispatch_notification(
        order.user_id,
        type_map.get(order.status, Notification.NotificationType.ACCOUNT),
        title,
        template.format(order=order.order_number),
        order.id,
    )
