class BaseDeliveryStrategy:
    """
    Adding a new delivery method = one new file implementing this interface
    + registering it below. No branching logic scattered across views.
    """

    status_flow: list[str] = []
    admin_actions: list[dict] = []  # [{"action": "confirm_payment", "label": "Confirm Payment", "to_status": "PAID"}]

    @classmethod
    def get_status_flow(cls):
        return cls.status_flow

    @classmethod
    def get_admin_actions(cls):
        return cls.admin_actions


def get_strategy(delivery_method: str) -> type[BaseDeliveryStrategy]:
    from .game_code import GameCodeStrategy
    from .manual_activation import ManualActivationStrategy
    from .steam_gift import SteamGiftStrategy
    from .steam_trade import SteamTradeStrategy

    registry = {
        "STEAM_GIFT": SteamGiftStrategy,
        "STEAM_TRADE": SteamTradeStrategy,
        "GAME_CODE": GameCodeStrategy,
        "MANUAL_ACTIVATION": ManualActivationStrategy,
    }
    return registry[delivery_method]
