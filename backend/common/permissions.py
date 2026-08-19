from rest_framework.permissions import BasePermission

ADMIN_ROLES = {"SUPPORT", "FULFILLMENT_ADMIN", "SUPER_ADMIN"}


class IsOwner(BasePermission):
    """Object-level check: a customer may only touch their own records."""

    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "user", None) or getattr(obj, "customer", None)
        return owner == request.user


class IsAnyAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "role", None) in ADMIN_ROLES
        )


class IsFulfillmentAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in {"FULFILLMENT_ADMIN", "SUPER_ADMIN"}
        )


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated and request.user.role == "SUPER_ADMIN"
        )
