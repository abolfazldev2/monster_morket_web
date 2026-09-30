from django.contrib.auth import get_user_model
from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsFulfillmentAdmin
from common.validators import get_client_ip

from .models import Fulfillment, FulfillmentNote
from .serializers import (
    AddNoteSerializer,
    AssignAdminSerializer,
    FulfillmentAdminListSerializer,
    FulfillmentSerializer,
)
from .services import assign_admin, transition_fulfillment

User = get_user_model()


class FulfillmentAdminViewSet(viewsets.ReadOnlyModelViewSet):
    """Admin-only queue: /api/admin/fulfillment/"""

    queryset = Fulfillment.objects.select_related(
        "order_item__order__user", "order_item__product", "assigned_admin"
    ).prefetch_related("notes")
    permission_classes = [IsFulfillmentAdmin]
    filterset_fields = ["status", "delivery_method", "assigned_admin"]

    def get_serializer_class(self):
        if self.action == "list":
            return FulfillmentAdminListSerializer
        return FulfillmentSerializer

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        fulfillment = self.get_object()
        action_name = request.data.get("action")
        try:
            transition_fulfillment(fulfillment, action_name, request.user, ip_address=get_client_ip(request))
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        return Response(FulfillmentSerializer(fulfillment).data)

    @action(detail=True, methods=["post"])
    def notes(self, request, pk=None):
        fulfillment = self.get_object()
        serializer = AddNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        FulfillmentNote.objects.create(
            fulfillment=fulfillment, author=request.user, note=serializer.validated_data["note"]
        )
        return Response(FulfillmentSerializer(fulfillment).data)

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        fulfillment = self.get_object()
        serializer = AssignAdminSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        admin_user = User.objects.get(pk=serializer.validated_data["admin_id"], role__in=[
            "SUPPORT", "FULFILLMENT_ADMIN", "SUPER_ADMIN",
        ])
        assign_admin(fulfillment, admin_user, request.user)
        return Response(FulfillmentSerializer(fulfillment).data)
