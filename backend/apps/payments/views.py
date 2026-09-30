from rest_framework import permissions, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.decorators import action
from rest_framework.response import Response

from common.permissions import IsAnyAdmin
from common.validators import get_client_ip

from .models import Payment
from .serializers import ConfirmPaymentSerializer, PaymentSerializer
from .services import confirm_payment


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Payment.objects.select_related("order")
        if self.request.user.role in {"SUPPORT", "FULFILLMENT_ADMIN", "SUPER_ADMIN"}:
            return qs
        return qs.filter(order__user=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[IsAnyAdmin])
    def confirm(self, request, pk=None):
        payment = self.get_object()
        serializer = ConfirmPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            payment = confirm_payment(
                payment, request.user, ip_address=get_client_ip(request),
                transaction_reference=serializer.validated_data["transaction_reference"],
                note=serializer.validated_data.get("note", ""),
            )
        except ValueError as exc:
            raise ValidationError({"detail": str(exc)}) from exc
        return Response(PaymentSerializer(payment).data)
