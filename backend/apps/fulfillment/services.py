from django.db import transaction
from django.utils import timezone

from common.models import AuditLog

from .delivery_methods import get_strategy
from .models import Fulfillment

_TIMESTAMP_FIELD_BY_STATUS = {
    Fulfillment.Status.STEAM_FRIEND_REQUESTED: "friend_requested_at",
    Fulfillment.Status.WAITING_TRADE: "trade_ready_at",
    Fulfillment.Status.DELIVERED: "delivered_at",
    Fulfillment.Status.COMPLETED: "completed_at",
}


@transaction.atomic
def transition_fulfillment(fulfillment: Fulfillment, action: str, admin_user, ip_address=None):
    strategy = get_strategy(fulfillment.delivery_method)
    matching = next((a for a in strategy.get_admin_actions() if a["action"] == action), None)
    if not matching:
        raise ValueError(f"Action '{action}' is not valid for delivery method '{fulfillment.delivery_method}'.")

    old_status = fulfillment.status
    new_status = matching["to_status"]
    flow = strategy.get_status_flow()
    if old_status not in flow or flow.index(new_status) != flow.index(old_status) + 1:
        raise ValueError(f"Action '{action}' is not valid from fulfillment status '{old_status}'.")
    fulfillment.status = new_status

    ts_field = _TIMESTAMP_FIELD_BY_STATUS.get(new_status)
    update_fields = ["status"]
    if ts_field:
        setattr(fulfillment, ts_field, timezone.now())
        update_fields.append(ts_field)

    fulfillment.save(update_fields=update_fields)

    if new_status == Fulfillment.Status.PROCESSING:
        from apps.orders.models import Order
        order = fulfillment.order_item.order
        if order.status == Order.Status.PAID:
            order.status = Order.Status.PROCESSING
            order.save(update_fields=["status"])

    AuditLog.record(
        user=admin_user, action=f"fulfillment_{action}", target=fulfillment,
        old_value={"status": old_status}, new_value={"status": new_status},
        ip_address=ip_address,
    )

    if new_status == Fulfillment.Status.COMPLETED:
        _maybe_complete_order(fulfillment)

    return fulfillment


def _maybe_complete_order(fulfillment: Fulfillment):
    """Order moves to COMPLETED once every item's fulfillment is COMPLETED."""
    order = fulfillment.order_item.order
    all_complete = all(
        item.fulfillment.status == Fulfillment.Status.COMPLETED for item in order.items.select_related("fulfillment")
    )
    if all_complete:
        from apps.orders.models import Order
        order.status = Order.Status.COMPLETED
        order.save(update_fields=["status"])

        from django.db import transaction
        from apps.notifications.services import notify_order_status_changed
        transaction.on_commit(lambda: notify_order_status_changed(order))


@transaction.atomic
def assign_admin(fulfillment: Fulfillment, admin_user, acting_user):
    old = fulfillment.assigned_admin_id
    fulfillment.assigned_admin = admin_user
    fulfillment.save(update_fields=["assigned_admin"])
    AuditLog.record(
        user=acting_user, action="fulfillment_assign", target=fulfillment,
        old_value={"assigned_admin": old}, new_value={"assigned_admin": admin_user.id},
    )
    return fulfillment
