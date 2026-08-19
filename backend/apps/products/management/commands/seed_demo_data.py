from django.core.management.base import BaseCommand

from apps.games.models import Category, Game
from apps.products.models import DeliveryMethod, Product, ProductRequiredField, ProductVariant


class Command(BaseCommand):
    help = "Seeds MONSTER Market with demo games/categories/products so the store isn't empty on first deploy."

    def handle(self, *args, **options):
        cs2 = self._game("CS2", "cs2")
        dota2 = self._game("Dota 2", "dota2")
        wow = self._game("World of Warcraft", "wow")
        faceit = self._game("FACEIT", "faceit")

        cs2_items = self._category(cs2, "Items", "items")
        dota_items = self._category(dota2, "Items", "items")
        wow_gametime = self._category(wow, "Game Time", "game-time")
        faceit_premium = self._category(faceit, "Premium", "premium")

        pudge = self._product(
            dota2, dota_items, "Pudge Arcana", "pudge-arcana", "item", 18.40,
            DeliveryMethod.STEAM_GIFT,
            "Official Dota 2 Arcana item for Pudge, delivered via Steam gift.",
        )
        self._required_field(pudge, "steam_profile_url", "Steam Profile URL or SteamID64", "url",
                              r"^(https://steamcommunity\.com/(id|profiles)/[\w-]+/?|\d{17})$")

        ak47 = self._product(
            cs2, cs2_items, "AK-47 | Redline (Field-Tested)", "ak47-redline-ft", "item", 24.90,
            DeliveryMethod.STEAM_TRADE,
            "CS2 weapon skin, delivered via direct Steam trade.",
        )
        self._required_field(ak47, "steam_profile_url", "Steam Profile URL or SteamID64", "url",
                              r"^(https://steamcommunity\.com/(id|profiles)/[\w-]+/?|\d{17})$")

        gametime = self._product(
            wow, wow_gametime, "WoW Game Time", "wow-game-time", "game_time", 14.99,
            DeliveryMethod.GAME_CODE,
            "World of Warcraft subscription time, delivered as a redeemable code.",
        )
        for name, price, days in [("30 Days", 14.99, 30), ("60 Days", 27.99, 60), ("90 Days", 39.99, 90)]:
            ProductVariant.objects.get_or_create(product=gametime, name=name, defaults={"price_override": price, "sort_order": days})
        self._required_field(gametime, "battlenet_account", "Battle.net Account", "text")
        self._required_field(gametime, "region", "Region", "select", options=[
            {"value": "eu", "label": "Europe"}, {"value": "us", "label": "Americas"},
        ])

        premium = self._product(
            faceit, faceit_premium, "FACEIT Premium", "faceit-premium", "subscription", 8.00,
            DeliveryMethod.MANUAL_ACTIVATION,
            "FACEIT Premium subscription, activated manually on your account.",
        )
        for name, price, months in [("1 Month", 8.00, 1), ("3 Months", 21.00, 3), ("12 Months", 72.00, 12)]:
            ProductVariant.objects.get_or_create(product=premium, name=name, defaults={"price_override": price, "sort_order": months})
        self._required_field(premium, "faceit_username", "FACEIT Username", "text")

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))

    def _game(self, name, slug):
        game, _ = Game.objects.get_or_create(slug=slug, defaults={"name": name})
        return game

    def _category(self, game, name, slug):
        category, _ = Category.objects.get_or_create(game=game, slug=slug, defaults={"name": name})
        return category

    def _product(self, game, category, name, slug, product_type, price, delivery_method, description):
        product, _ = Product.objects.get_or_create(
            slug=slug,
            defaults={
                "game": game, "category": category, "name": name, "product_type": product_type,
                "base_price": price, "delivery_method": delivery_method, "description": description,
                "is_active": True,
            },
        )
        return product

    def _required_field(self, product, key, label, field_type, regex="", options=None):
        ProductRequiredField.objects.get_or_create(
            product=product, field_key=key,
            defaults={"label": label, "field_type": field_type, "validation_regex": regex, "options": options},
        )
