from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.fulfillment.models import Fulfillment
from apps.fulfillment.services import transition_fulfillment
from apps.games.models import Category, Game
from apps.orders.models import Order, OrderItem
from apps.products.models import DeliveryMethod, Product


class FulfillmentTransitionTests(TestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            username="operator", email="operator@example.com", password="password12345", role="FULFILLMENT_ADMIN"
        )
        game = Game.objects.create(name="Test Game", slug="test-game")
        category = Category.objects.create(game=game, name="Items", slug="items")
        product = Product.objects.create(
            game=game,
            category=category,
            name="Test Item",
            slug="test-item",
            product_type="item",
            base_price="5.00",
            delivery_method=DeliveryMethod.STEAM_GIFT,
        )
        user = get_user_model().objects.create_user(
            username="customer", email="customer@example.com", password="password12345"
        )
        order = Order.objects.create(user=user, subtotal="5.00", total="5.00")
        item = OrderItem.objects.create(
            order=order, product=product, quantity=1, unit_price="5.00", subtotal="5.00"
        )
        self.fulfillment = Fulfillment.objects.create(
            order_item=item,
            delivery_method=DeliveryMethod.STEAM_GIFT,
            status=Fulfillment.Status.WAITING_FOR_PAYMENT,
        )

    def test_cannot_skip_required_fulfillment_steps(self):
        with self.assertRaises(ValueError):
            transition_fulfillment(self.fulfillment, "friend_requested", self.admin)

        self.assertEqual(self.fulfillment.status, Fulfillment.Status.WAITING_FOR_PAYMENT)

    def test_only_next_action_is_available_and_can_be_applied(self):
        self.fulfillment.status = Fulfillment.Status.PAID
        self.fulfillment.save(update_fields=["status"])

        transition_fulfillment(self.fulfillment, "start_fulfillment", self.admin)

        self.fulfillment.refresh_from_db()
        self.assertEqual(self.fulfillment.status, Fulfillment.Status.PROCESSING)
        with self.assertRaises(ValueError):
            transition_fulfillment(self.fulfillment, "start_fulfillment", self.admin)
