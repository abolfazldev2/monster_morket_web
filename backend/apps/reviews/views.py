from rest_framework import permissions, viewsets

from common.permissions import IsAnyAdmin

from .models import Review
from .serializers import AdminReviewSerializer, ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_fields = ["product"]
    http_method_names = ["get", "post", "head", "options"]

    def get_queryset(self):
        return Review.objects.filter(is_approved=True).select_related("user")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AdminReviewViewSet(viewsets.ModelViewSet):
    """Sees every review including unapproved ones; can approve/reject/delete."""

    queryset = Review.objects.select_related("user", "product")
    permission_classes = [IsAnyAdmin]
    filterset_fields = ["is_approved", "product"]
    http_method_names = ["get", "patch", "delete", "head"]

    def get_serializer_class(self):
        return AdminReviewSerializer
