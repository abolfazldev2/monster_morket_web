from .base import BaseDeliveryStrategy


class GameCodeStrategy(BaseDeliveryStrategy):
    """Used for e.g. WoW Game Time delivered as a redeemable code."""

    status_flow = ["PENDING", "WAITING_FOR_PAYMENT", "PAID", "PROCESSING", "DELIVERED", "COMPLETED"]
    admin_actions = [
        {"action": "confirm_payment", "label": "Confirm Payment", "to_status": "PAID"},
        {"action": "start_fulfillment", "label": "Start Fulfillment", "to_status": "PROCESSING"},
        {"action": "delivered", "label": "Code Delivered", "to_status": "DELIVERED"},
        {"action": "complete", "label": "Complete Order", "to_status": "COMPLETED"},
    ]
