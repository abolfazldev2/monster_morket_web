import secrets

from django.db.models import Sum
from rest_framework import generics, permissions, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from apps.orders.models import Order
from common.permissions import IsSuperAdmin

from .models import PasswordResetToken, User
from .serializers import AccountStatsSerializer, RegisterSerializer, UserSerializer


class AdminUserSerializer(serializers.ModelSerializer):
    """Separate from UserSerializer (not a subclass) — role and is_active must be
    writable here for admin role management, unlike the self-service /me/ endpoint
    where a customer must never be able to set their own role."""

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name",
            "role", "preferred_language", "date_joined", "is_active",
        ]
        read_only_fields = ["id", "username", "email", "date_joined"]


class AdminUserViewSet(viewsets.ModelViewSet):
    """Only SUPER_ADMIN can list/edit users and change roles — the most sensitive admin surface."""

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsSuperAdmin]
    http_method_names = ["get", "patch", "head"]
    filterset_fields = ["role", "is_active"]

    def perform_update(self, serializer):
        from common.models import AuditLog

        old_role = serializer.instance.role
        old_active = serializer.instance.is_active
        instance = serializer.save()
        if old_role != instance.role or old_active != instance.is_active:
            AuditLog.record(
                user=self.request.user, action="user_update", target=instance,
                old_value={"role": old_role, "is_active": old_active},
                new_value={"role": instance.role, "is_active": instance.is_active},
            )


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class AccountStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user)
        data = {
            "total_orders": orders.count(),
            "completed_orders": orders.filter(status=Order.Status.COMPLETED).count(),
            "pending_orders": orders.filter(
                status__in=[Order.Status.PENDING, Order.Status.WAITING_FOR_PAYMENT, Order.Status.PAID, Order.Status.PROCESSING]
            ).count(),
            "total_spent": orders.filter(status=Order.Status.COMPLETED).aggregate(s=Sum("total"))["s"] or 0,
        }
        return Response(AccountStatsSerializer(data).data)


class PasswordResetRequestView(APIView):
    """
    Always returns 200 regardless of whether the email exists, to avoid
    leaking which emails are registered. Actual email dispatch is a Celery
    task left for the notifications app to wire up to a real mail provider.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        email = request.data.get("email", "")
        user = User.objects.filter(email__iexact=email).first()
        if user:
            token = secrets.token_urlsafe(32)
            PasswordResetToken.objects.create(user=user, token=token)
            # TODO: dispatch a Celery task to email the reset link containing `token`
        return Response({"detail": "If that email exists, reset instructions were sent."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        token_value = request.data.get("token")
        new_password = request.data.get("password")
        reset_token = PasswordResetToken.objects.filter(token=token_value).first()
        if not reset_token or not reset_token.is_valid():
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth import password_validation
        from django.utils import timezone

        password_validation.validate_password(new_password, reset_token.user)
        reset_token.user.set_password(new_password)
        reset_token.user.save(update_fields=["password"])
        reset_token.used_at = timezone.now()
        reset_token.save(update_fields=["used_at"])
        return Response({"detail": "Password updated."})
