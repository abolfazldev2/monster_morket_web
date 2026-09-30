from django.contrib.auth import get_user_model
from django.test import TestCase

from apps.fulfillment.models import Fulfillment
from apps.games.models import Category, Game
from apps.orders.models import Order, OrderItem
from apps.payments.models import Payment
from apps.payments.services import confirm_payment
from apps.products.models import DeliveryMethod, Product


class ConfirmPaymentTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            username="operator", email="operator@example.com", password="password12345", role="SUPER_ADMIN"
        )
        customer = User.objects.create_user(
            username="customer", email="customer@example.com", password="password12345"
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
            delivery_method=DeliveryMethod.GAME_CODE,
        )
        self.order = Order.objects.create(user=customer, subtotal="5.00", total="5.00")
        item = OrderItem.objects.create(
            order=self.order, product=product, quantity=1, unit_price="5.00", subtotal="5.00"
        )
        self.fulfillment = Fulfillment.objects.create(
            order_item=item,
            delivery_method=DeliveryMethod.GAME_CODE,
            status=Fulfillment.Status.WAITING_FOR_PAYMENT,
        )
        self.payment = Payment.objects.create(
            order=self.order,
            amount="5.00",
            status=Payment.Status.WAITING_FOR_PAYMENT,
        )

    def test_confirmation_marks_order_paid_and_fulfillment_ready_once(self):
        confirm_payment(self.payment, self.admin)

        self.payment.refresh_from_db()
        self.order.refresh_from_db()
        self.fulfillment.refresh_from_db()
        self.assertEqual(self.payment.status, Payment.Status.PAYMENT_RECEIVED)
        self.assertEqual(self.order.status, Order.Status.PAID)
        self.assertEqual(self.fulfillment.status, Fulfillment.Status.PAID)

        with self.assertRaises(ValueError):
            confirm_payment(self.payment, self.admin)
