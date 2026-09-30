from django.core.management.base import BaseCommand

from apps.games.models import Category, Game
from apps.products.models import (
    DeliveryMethod,
    Product,
    ProductRequiredField,
    ProductTranslation,
    ProductVariant,
)


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
        self._translation(pudge, "Pudge Arcana", "آرکانای Pudge",
                          "آیتم آرکانای Pudge در Dota 2 که به‌صورت هدیهٔ استیم تحویل می‌شود.")

        ak47 = self._product(
            cs2, cs2_items, "AK-47 | Redline (Field-Tested)", "ak47-redline-ft", "item", 24.90,
            DeliveryMethod.STEAM_TRADE,
            "CS2 weapon skin, delivered via direct Steam trade.",
        )
        self._required_field(ak47, "steam_profile_url", "Steam Profile URL or SteamID64", "url",
                              r"^(https://steamcommunity\.com/(id|profiles)/[\w-]+/?|\d{17})$")
        self._translation(ak47, "AK-47 | Redline (Field-Tested)", "اسکین AK-47 | ردلاین (میدان‌آزمایی‌شده)",
                          "اسکین CS2 با وضعیت میدان‌آزمایی‌شده؛ تحویل از طریق معاملهٔ استیم.")

        awp = self._product(
            cs2, cs2_items, "AWP | Asiimov (Battle-Scarred)", "awp-asiimov-bs", "item", 42.50,
            DeliveryMethod.STEAM_TRADE,
            "Iconic orange-and-white AWP skin in battle-scarred condition. Delivered by Steam trade.",
        )
        self._required_field(awp, "steam_profile_url", "Steam Profile URL or SteamID64", "url",
                              r"^(https://steamcommunity\.com/(id|profiles)/[\w-]+/?|\d{17})$")
        self._translation(awp, "AWP | Asiimov (Battle-Scarred)", "اسکین AWP | اسییموف (فرسوده در نبرد)",
                          "اسکین نارنجی و سفید AWP با وضعیت فرسوده در نبرد؛ تحویل از طریق معاملهٔ استیم.")

        deagle = self._product(
            cs2, cs2_items, "Desert Eagle | Printstream", "deagle-printstream", "item", 31.75,
            DeliveryMethod.STEAM_TRADE,
            "Pearl-white Desert Eagle Printstream skin, delivered via Steam trade.",
        )
        self._required_field(deagle, "steam_profile_url", "Steam Profile URL or SteamID64", "url",
                              r"^(https://steamcommunity\.com/(id|profiles)/[\w-]+/?|\d{17})$")
        self._translation(deagle, "Desert Eagle | Printstream", "اسکین Desert Eagle | پرینت‌استریم",
                          "اسکین سفید مرواریدی Desert Eagle؛ تحویل از طریق معاملهٔ استیم.")

        pa_arcana = self._product(
            dota2, dota_items, "Phantom Assassin | Manifold Paradox", "pa-manifold-paradox", "item", 22.00,
            DeliveryMethod.STEAM_GIFT,
            "Manifold Paradox Arcana for Phantom Assassin, delivered as an in-game Steam gift.",
        )
        self._required_field(pa_arcana, "steam_profile_url", "Steam Profile URL or SteamID64", "url",
                              r"^(https://steamcommunity\.com/(id|profiles)/[\w-]+/?|\d{17})$")
        self._translation(pa_arcana, "Phantom Assassin | Manifold Paradox", "آرکانای Phantom Assassin | مانیفولد پارادوکس",
                          "آرکانای مانیفولد پارادوکس برای Phantom Assassin؛ ارسال به‌صورت هدیهٔ درون‌بازی استیم.")

        hook = self._product(
            dota2, dota_items, "Pudge | Dragonclaw Hook", "pudge-dragonclaw-hook", "item", 16.25,
            DeliveryMethod.STEAM_GIFT,
            "Classic Dragonclaw Hook cosmetic for Pudge, delivered as an in-game Steam gift.",
        )
        self._required_field(hook, "steam_profile_url", "Steam Profile URL or SteamID64", "url",
                              r"^(https://steamcommunity\.com/(id|profiles)/[\w-]+/?|\d{17})$")
        self._translation(hook, "Pudge | Dragonclaw Hook", "قلاب Dragonclaw برای Pudge",
                          "آیتم کلاسیک Dragonclaw Hook برای Pudge؛ ارسال به‌صورت هدیهٔ درون‌بازی استیم.")

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
        self._translation(gametime, "WoW Game Time", "زمان بازی World of Warcraft",
                          "کد شارژ زمان بازی World of Warcraft. مدت ۳۰، ۶۰ یا ۹۰ روز را انتخاب کنید.")

        wow_30 = self._product(
            wow, wow_gametime, "WoW Game Time | 30 Days", "wow-game-time-30", "game_time", 14.99,
            DeliveryMethod.GAME_CODE,
            "30-day World of Warcraft game time code. Select your region and provide your Battle.net account.",
        )
        self._required_field(wow_30, "battlenet_account", "Battle.net Account", "text")
        self._required_field(wow_30, "region", "Region", "select", options=[
            {"value": "eu", "label": "Europe"}, {"value": "us", "label": "Americas"},
        ])
        self._translation(wow_30, "WoW Game Time | 30 Days", "زمان بازی WoW | ۳۰ روز",
                          "کد ۳۰ روز زمان بازی World of Warcraft. منطقه و حساب Battle.net را وارد کنید.")

        wow_90 = self._product(
            wow, wow_gametime, "WoW Game Time | 90 Days", "wow-game-time-90", "game_time", 39.99,
            DeliveryMethod.GAME_CODE,
            "90-day World of Warcraft game time code. Select your region and provide your Battle.net account.",
        )
        self._required_field(wow_90, "battlenet_account", "Battle.net Account", "text")
        self._required_field(wow_90, "region", "Region", "select", options=[
            {"value": "eu", "label": "Europe"}, {"value": "us", "label": "Americas"},
        ])
        self._translation(wow_90, "WoW Game Time | 90 Days", "زمان بازی WoW | ۹۰ روز",
                          "کد ۹۰ روز زمان بازی World of Warcraft. منطقه و حساب Battle.net را وارد کنید.")

        premium = self._product(
            faceit, faceit_premium, "FACEIT Premium", "faceit-premium", "subscription", 8.00,
            DeliveryMethod.MANUAL_ACTIVATION,
            "FACEIT Premium subscription, activated manually on your account.",
        )
        for name, price, months in [("1 Month", 8.00, 1), ("3 Months", 21.00, 3), ("12 Months", 72.00, 12)]:
            ProductVariant.objects.get_or_create(product=premium, name=name, defaults={"price_override": price, "sort_order": months})
        self._required_field(premium, "faceit_username", "FACEIT Username", "text")
        self._translation(premium, "FACEIT Premium", "اشتراک FACEIT Premium",
                          "اشتراک پریمیوم FACEIT با فعال‌سازی دستی روی حساب شما.")

        faceit_3 = self._product(
            faceit, faceit_premium, "FACEIT Premium | 3 Months", "faceit-premium-3-months", "subscription", 21.00,
            DeliveryMethod.MANUAL_ACTIVATION,
            "Three-month FACEIT Premium subscription, activated manually on your account.",
        )
        self._required_field(faceit_3, "faceit_username", "FACEIT Username", "text")
        self._translation(faceit_3, "FACEIT Premium | 3 Months", "FACEIT Premium | سه‌ماهه",
                          "اشتراک سه‌ماههٔ FACEIT Premium؛ پس از پرداخت روی حساب شما فعال می‌شود.")

        faceit_12 = self._product(
            faceit, faceit_premium, "FACEIT Premium | 12 Months", "faceit-premium-12-months", "subscription", 72.00,
            DeliveryMethod.MANUAL_ACTIVATION,
            "Twelve-month FACEIT Premium subscription, activated manually on your account.",
        )
        self._required_field(faceit_12, "faceit_username", "FACEIT Username", "text")
        self._translation(faceit_12, "FACEIT Premium | 12 Months", "FACEIT Premium | دوازده‌ماهه",
                          "اشتراک دوازده‌ماههٔ FACEIT Premium؛ پس از پرداخت روی حساب شما فعال می‌شود.")

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
                "is_active": True, "stock": 25,
            },
        )
        return product

    def _translation(self, product, english_name, persian_name, persian_description):
        ProductTranslation.objects.update_or_create(
            product=product,
            language_code=ProductTranslation.Language.EN,
            defaults={"name": english_name, "description": product.description},
        )
        ProductTranslation.objects.update_or_create(
            product=product,
            language_code=ProductTranslation.Language.FA,
            defaults={"name": persian_name, "description": persian_description},
        )

    def _required_field(self, product, key, label, field_type, regex="", options=None):
        ProductRequiredField.objects.get_or_create(
            product=product, field_key=key,
            defaults={"label": label, "field_type": field_type, "validation_regex": regex, "options": options},
        )
