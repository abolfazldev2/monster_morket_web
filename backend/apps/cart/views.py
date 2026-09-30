from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from .models import CartItem
from .serializers import AddCartItemSerializer, CartItemSerializer, CartSerializer, UpdateCartItemSerializer
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

        existing = CartItem.objects.filter(cart=cart, product=product, variant=variant).first()
        requested_quantity = quantity + (existing.quantity if existing else 0)
        if product.stock is not None and requested_quantity > product.stock:
            raise ValidationError({"quantity": "Requested quantity exceeds available stock."})
        if variant and variant.stock is not None and requested_quantity > variant.stock:
            raise ValidationError({"quantity": "Requested quantity exceeds available variant stock."})

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
        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quantity = serializer.validated_data["quantity"]
        if item.product.stock is not None and quantity > item.product.stock:
            raise ValidationError({"quantity": "Requested quantity exceeds available stock."})
        if item.variant and item.variant.stock is not None and quantity > item.variant.stock:
            raise ValidationError({"quantity": "Requested quantity exceeds available variant stock."})
        item.quantity = quantity
        item.save(update_fields=["quantity"])
        return Response(CartItemSerializer(item).data)

    def remove_item(self, request, item_id=None):
        cart = get_or_create_cart(request)
        deleted, _ = cart.items.filter(pk=item_id).delete()
        if not deleted:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
