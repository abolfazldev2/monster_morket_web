from rest_framework.routers import DefaultRouter

from .views import AdminReviewViewSet, ReviewViewSet

router = DefaultRouter()
router.register("", ReviewViewSet, basename="review")

admin_router = DefaultRouter()
admin_router.register("", AdminReviewViewSet, basename="admin-review")

urlpatterns = router.urls
admin_urlpatterns = admin_router.urls
