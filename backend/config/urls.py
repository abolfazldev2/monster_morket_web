from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.cart.services import merge_guest_cart_into_user_cart 
from apps.coupons.urls import admin_urlpatterns as coupons_admin_urls
from apps.reviews.urls import admin_urlpatterns as reviews_admin_urls
from apps.users.urls import admin_urlpatterns as users_admin_urls


# یک کلاس سفارشی برای صدور توکن که سبد خرید را هم هندل می‌کند
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            user = serializer.user
            # انتقال آیتم‌های سبد خرید مهمان به حساب این کاربر
            merge_guest_cart_into_user_cart(request, user)
        return response
urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/auth/token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/users/", include("apps.users.urls")),
    path("api/games/", include("apps.games.urls")),
    path("api/", include("apps.products.urls")),
    path("api/cart/", include("apps.cart.urls")),
    path("api/orders/", include("apps.orders.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/admin/fulfillment/", include("apps.fulfillment.urls")),
    path("api/wishlist/", include("apps.wishlist.urls")),
    path("api/coupons/", include("apps.coupons.urls")),
    path("api/reviews/", include("apps.reviews.urls")),
    path("api/notifications/", include("apps.notifications.urls")),
    # ---- Admin CRUD surface (all IsAnyAdmin/IsSuperAdmin gated) ----
    path("api/admin/products/", include("apps.products.admin_urls")),
    path("api/admin/games/", include("apps.games.admin_urls")),
    path("api/admin/coupons/", include(coupons_admin_urls)),
    path("api/admin/reviews/", include(reviews_admin_urls)),
    path("api/admin/users/", include(users_admin_urls)),
    path("api/admin/", include("common.admin_urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
