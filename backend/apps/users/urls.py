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
from .steam import SteamCallbackView, SteamConnectView, SteamConnectionView, SteamInventoryView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", MeView.as_view(), name="me"),
    path("me/stats/", AccountStatsView.as_view(), name="account-stats"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("steam/connect/", SteamConnectView.as_view(), name="steam-connect"),
    path("steam/callback/", SteamCallbackView.as_view(), name="steam-callback"),
    path("steam/connection/", SteamConnectionView.as_view(), name="steam-connection"),
    path("steam/inventory/", SteamInventoryView.as_view(), name="steam-inventory"),
]

admin_router = DefaultRouter()
admin_router.register("", AdminUserViewSet, basename="admin-user")
admin_urlpatterns = admin_router.urls
