import django_filters
from django.db.models import TextField
from django.db.models import Q
from django.db.models.functions import Cast

from .models import Product


class ProductFilter(django_filters.FilterSet):
    game = django_filters.CharFilter(field_name="game__slug")
    category = django_filters.CharFilter(field_name="category__slug")
    product_type = django_filters.CharFilter(field_name="product_type")
    min_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="lte")
    wear = django_filters.CharFilter(field_name="wear", lookup_expr="iexact")
    rarity = django_filters.CharFilter(field_name="rarity", lookup_expr="iexact")
    min_float = django_filters.NumberFilter(field_name="float_value", lookup_expr="gte")
    max_float = django_filters.NumberFilter(field_name="float_value", lookup_expr="lte")
    pattern_id = django_filters.NumberFilter(field_name="pattern_id")
    sticker = django_filters.CharFilter(method="filter_sticker")
    search = django_filters.CharFilter(method="filter_search")
    sort = django_filters.OrderingFilter(
        fields=(
            ("base_price", "price_asc"),
            ("-base_price", "price_desc"),
            ("-created_at", "newest"),
        )
    )

    class Meta:
        model = Product
        fields = ["game", "category", "product_type", "is_featured", "is_best_seller"]

    def filter_search(self, queryset, name, value):
        return queryset.filter(Q(name__icontains=value) | Q(rarity__icontains=value))

    def filter_sticker(self, queryset, name, value):
        return queryset.annotate(stickers_text=Cast("stickers", output_field=TextField())).filter(
            stickers_text__icontains=value
        )
