from rest_framework.routers import DefaultRouter

from .admin_views import AdminProductViewSet

router = DefaultRouter()
router.register("", AdminProductViewSet, basename="admin-product")

urlpatterns = router.urls
