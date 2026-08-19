import django_filters

from .models import Product


class ProductFilter(django_filters.FilterSet):
    game = django_filters.CharFilter(field_name="game__slug")
    category = django_filters.CharFilter(field_name="category__slug")
    product_type = django_filters.CharFilter(field_name="product_type")
    min_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="base_price", lookup_expr="lte")
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
        return queryset.filter(name__icontains=value)
