from rest_framework import serializers, viewsets

from common.permissions import IsAnyAdmin

from .models import Category, Game


class AdminCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "game", "name", "slug", "sort_order"]


class AdminGameSerializer(serializers.ModelSerializer):
    categories = AdminCategorySerializer(many=True, read_only=True)

    class Meta:
        model = Game
        fields = ["id", "name", "slug", "icon", "banner_image", "is_active", "sort_order", "categories"]


class AdminGameViewSet(viewsets.ModelViewSet):
    queryset = Game.objects.prefetch_related("categories")
    serializer_class = AdminGameSerializer
    permission_classes = [IsAnyAdmin]


class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.select_related("game")
    serializer_class = AdminCategorySerializer
    permission_classes = [IsAnyAdmin]
    filterset_fields = ["game"]
