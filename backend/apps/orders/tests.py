from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.cart.models import Cart, CartItem
from apps.games.models import Category, Game
from apps.orders.services import create_order_from_cart
from apps.products.models import DeliveryMethod, Product, ProductRequiredField, ProductVariant


class CreateOrderTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="buyer", email="buyer@example.com", password="password12345"
        )
        game = Game.objects.create(name="Test Game", slug="test-game")
        category = Category.objects.create(game=game, name="Items", slug="items")
        self.product = Product.objects.create(
            game=game,
            category=category,
            name="Test Item",
            slug="test-item",
            product_type="item",
            base_price="5.00",
            stock=5,
            delivery_method=DeliveryMethod.GAME_CODE,
        )
        ProductRequiredField.objects.create(
            product=self.product,
            field_key="region",
            label="Region",
            field_type=ProductRequiredField.FieldType.SELECT,
            options=[{"value": "eu", "label": "Europe"}],
        )
        self.cart = Cart.objects.create(user=self.user)
        self.cart_item = CartItem.objects.create(cart=self.cart, product=self.product, quantity=2)

    def test_rejects_invalid_select_value_without_consuming_stock(self):
        with self.assertRaises(ValidationError):
            create_order_from_cart(
                self.cart,
                self.user,
                {str(self.cart_item.id): {"region": "unknown"}},
            )

        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
        self.assertTrue(CartItem.objects.filter(pk=self.cart_item.pk).exists())

    def test_order_creation_consumes_stock_and_uses_current_variant_price(self):
        variant = ProductVariant.objects.create(
            product=self.product, name="Bundle", price_override="7.50", stock=3
        )
        self.cart_item.variant = variant
        self.cart_item.save(update_fields=["variant"])

        order = create_order_from_cart(
            self.cart,
            self.user,
            {str(self.cart_item.id): {"region": "eu"}},
        )

        self.product.refresh_from_db()
        variant.refresh_from_db()
        self.assertEqual(order.subtotal, Decimal("15.00"))
        self.assertEqual(self.product.stock, 3)
        self.assertEqual(variant.stock, 1)
        self.assertEqual(order.items.get().unit_price, Decimal("7.50"))

    def test_linked_steam_details_are_used_for_steam_trade_orders(self):
        self.user.steam_id64 = "76561198000000001"
        self.user.steam_trade_url = "https://steamcommunity.com/tradeoffer/new/?partner=123&token=abc"
        self.user.save(update_fields=["steam_id64", "steam_trade_url"])
        self.product.delivery_method = DeliveryMethod.STEAM_TRADE
        self.product.save(update_fields=["delivery_method"])
        ProductRequiredField.objects.create(
            product=self.product,
            field_key="steam_profile_url",
            label="Steam profile",
            field_type=ProductRequiredField.FieldType.URL,
            validation_regex=r"^https://steamcommunity\.com/(id|profiles)/[\w-]+/?$",
        )

        order = create_order_from_cart(self.cart, self.user, {str(self.cart_item.id): {"region": "eu"}})

        order_item = order.items.get()
        self.assertEqual(
            order_item.customer_data["steam_profile_url"],
            "https://steamcommunity.com/profiles/76561198000000001",
        )
        fulfillment = order_item.fulfillment
        self.assertEqual(fulfillment.steam_id64, self.user.steam_id64)
        self.assertEqual(fulfillment.steam_trade_url, self.user.steam_trade_url)
from decimal import Decimal
