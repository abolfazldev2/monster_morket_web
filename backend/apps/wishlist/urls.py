from django.urls import path

from .views import WishlistViewSet

list_view = WishlistViewSet.as_view({"get": "list"})
add_view = WishlistViewSet.as_view({"post": "add_item"})
detail_view = WishlistViewSet.as_view({"delete": "remove_item"})

urlpatterns = [
    path("", list_view, name="wishlist"),
    path("items/", add_view, name="wishlist-add"),
    path("items/<int:item_id>/", detail_view, name="wishlist-item-detail"),
]
