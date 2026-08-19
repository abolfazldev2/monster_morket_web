from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import CartItem
from .serializers import AddCartItemSerializer, CartItemSerializer, CartSerializer
from .services import get_or_create_cart


class CartViewSet(viewsets.ViewSet):
    """
    Single-cart-per-owner endpoints. GET / returns the current cart
    (guest or authenticated, decided by get_or_create_cart).
    """

    permission_classes = [permissions.AllowAny]

    def list(self, request):
        cart = get_or_create_cart(request)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"], url_path="items")
    def add_item(self, request):
        serializer = AddCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_or_create_cart(request)
        product = serializer.validated_data["product_id"]
        variant = serializer.validated_data.get("variant_id")
        quantity = serializer.validated_data["quantity"]

        item, created = CartItem.objects.get_or_create(
            cart=cart, product=product, variant=variant, defaults={"quantity": quantity}
        )
        if not created:
            item.quantity += quantity
            item.save(update_fields=["quantity"])
        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)

    def update_item(self, request, item_id=None):
        cart = get_or_create_cart(request)
        item = cart.items.filter(pk=item_id).first()
        if not item:
            return Response(status=status.HTTP_404_NOT_FOUND)
        quantity = request.data.get("quantity")
        if quantity is not None:
            item.quantity = max(1, int(quantity))
            item.save(update_fields=["quantity"])
        return Response(CartItemSerializer(item).data)

    def remove_item(self, request, item_id=None):
        cart = get_or_create_cart(request)
        deleted, _ = cart.items.filter(pk=item_id).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
