from django.urls import path

from .views import CartViewSet

cart_view = CartViewSet.as_view({"get": "list"})
add_item_view = CartViewSet.as_view({"post": "add_item"})
item_detail_view = CartViewSet.as_view({"patch": "update_item", "delete": "remove_item"})

urlpatterns = [
    path("", cart_view, name="cart-detail"),
    path("items/", add_item_view, name="cart-add-item"),
    path("items/<int:item_id>/", item_detail_view, name="cart-item-detail"),
]
