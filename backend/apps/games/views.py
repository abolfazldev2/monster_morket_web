from rest_framework import permissions, viewsets

from .models import Category, Game
from .serializers import CategorySerializer, GameListSerializer, GameSerializer


class GameViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Game.objects.filter(is_active=True).prefetch_related("categories")
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    pagination_class = None  # small, bounded list — always return the full array, unpaginated

    def get_serializer_class(self):
        if self.action == "list":
            return GameListSerializer
        return GameSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.select_related("game")
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ["game__slug"]
    pagination_class = None
