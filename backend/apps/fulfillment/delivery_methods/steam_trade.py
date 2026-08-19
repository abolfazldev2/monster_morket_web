from .base import BaseDeliveryStrategy


class SteamTradeStrategy(BaseDeliveryStrategy):
    """Used for e.g. CS2 items delivered via a direct Steam trade offer."""

    status_flow = [
        "PENDING", "WAITING_FOR_PAYMENT", "PAID", "PROCESSING",
        "STEAM_FRIEND_REQUESTED", "WAITING_TRADE", "DELIVERED", "COMPLETED",
    ]
    admin_actions = [
        {"action": "confirm_payment", "label": "Confirm Payment", "to_status": "PAID"},
        {"action": "start_fulfillment", "label": "Start Fulfillment", "to_status": "PROCESSING"},
        {"action": "friend_requested", "label": "Friend Request Sent", "to_status": "STEAM_FRIEND_REQUESTED"},
        {"action": "trade_ready", "label": "Trade Ready", "to_status": "WAITING_TRADE"},
        {"action": "delivered", "label": "Item Delivered", "to_status": "DELIVERED"},
        {"action": "complete", "label": "Complete Order", "to_status": "COMPLETED"},
    ]
