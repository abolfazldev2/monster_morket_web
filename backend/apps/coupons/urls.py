from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AdminCouponViewSet, ValidateCouponView

router = DefaultRouter()
router.register("", AdminCouponViewSet, basename="admin-coupon")

urlpatterns = [
    path("validate/", ValidateCouponView.as_view(), name="coupon-validate"),
]

admin_urlpatterns = router.urls
