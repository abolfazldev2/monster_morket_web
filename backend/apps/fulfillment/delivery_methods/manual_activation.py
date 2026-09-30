from .base import BaseDeliveryStrategy


class ManualActivationStrategy(BaseDeliveryStrategy):
    """Used for e.g. FACEIT Premium activated manually on the account."""

    status_flow = ["PENDING", "WAITING_FOR_PAYMENT", "PAID", "PROCESSING", "DELIVERED", "COMPLETED"]
    admin_actions = [
        {"action": "start_fulfillment", "label": "Start Fulfillment", "to_status": "PROCESSING"},
        {"action": "delivered", "label": "Activated", "to_status": "DELIVERED"},
        {"action": "complete", "label": "Complete Order", "to_status": "COMPLETED"},
    ]
