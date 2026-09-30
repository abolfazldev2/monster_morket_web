from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.games.models import Category, Game
from apps.products.models import Product, DeliveryMethod
from apps.reviews.models import Review


class PublicReviewTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="customer", email="customer@example.com", password="password12345"
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
            delivery_method=DeliveryMethod.GAME_CODE,
        )

    def test_new_review_is_not_published_until_admin_approval(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(
            "/api/reviews/",
            {"product": self.product.id, "rating": 5, "comment": "Great", "is_approved": True},
        )

        self.assertEqual(response.status_code, 201)
        review = Review.objects.get()
        self.assertFalse(review.is_approved)
        self.assertEqual(review.user, self.user)
        self.assertEqual(self.client.get("/api/reviews/").data["count"], 0)

    def test_public_endpoint_cannot_edit_or_delete_reviews(self):
        review = Review.objects.create(product=self.product, user=self.user, rating=5, is_approved=True)
        other_user = get_user_model().objects.create_user(
            username="other", email="other@example.com", password="password12345"
        )
        self.client.force_authenticate(other_user)

        self.assertEqual(self.client.patch(f"/api/reviews/{review.id}/", {"comment": "changed"}).status_code, 405)
        self.assertEqual(self.client.delete(f"/api/reviews/{review.id}/").status_code, 405)


class GameCategoryRouteTests(APITestCase):
    def test_public_category_route_is_not_captured_as_game_detail(self):
        game = Game.objects.create(name="Test Game", slug="test-game")
        Category.objects.create(game=game, name="Items", slug="items")

        response = self.client.get("/api/games/categories/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
