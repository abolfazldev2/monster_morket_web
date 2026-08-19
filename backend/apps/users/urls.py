from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AccountStatsView,
    AdminUserViewSet,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("me/stats/", AccountStatsView.as_view(), name="account-stats"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
]

admin_router = DefaultRouter()
admin_router.register("", AdminUserViewSet, basename="admin-user")
admin_urlpatterns = admin_router.urls
