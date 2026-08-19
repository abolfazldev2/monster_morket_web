from rest_framework.routers import DefaultRouter

from .views import FulfillmentAdminViewSet

router = DefaultRouter()
router.register("", FulfillmentAdminViewSet, basename="fulfillment-admin")

urlpatterns = router.urls
