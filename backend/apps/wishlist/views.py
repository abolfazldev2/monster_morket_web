from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Wishlist, WishlistItem
from .serializers import AddWishlistItemSerializer, WishlistItemSerializer


class WishlistViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        items = wishlist.items.select_related("product")
        return Response(WishlistItemSerializer(items, many=True).data)

    @action(detail=False, methods=["post"], url_path="items")
    def add_item(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        serializer = AddWishlistItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist, product=serializer.validated_data["product_id"]
        )
        return Response(WishlistItemSerializer(item).data, status=status.HTTP_201_CREATED)

    def remove_item(self, request, item_id=None):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        deleted, _ = wishlist.items.filter(pk=item_id).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
