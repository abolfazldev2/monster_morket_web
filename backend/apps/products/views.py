from django.db import models
from rest_framework import permissions, viewsets

from .filters import ProductFilter
from .models import Product
from .serializers import ProductDetailSerializer, ProductListSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Product.objects.filter(is_active=True)
        .filter(
            models.Q(is_marketplace_listing=False)
            | models.Q(is_marketplace_listing=True, seller_approved=True, seller__isnull=False)
        )
        .select_related("game", "category", "seller")
        .prefetch_related("translations", "variants", "required_fields")
    )
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filterset_class = ProductFilter

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["language_code"] = self.request.query_params.get("lang", "en")
        return ctx
