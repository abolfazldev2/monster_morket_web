from rest_framework.routers import DefaultRouter

from .admin_views import AdminCategoryViewSet, AdminGameViewSet

router = DefaultRouter()
router.register("categories", AdminCategoryViewSet, basename="admin-category")
router.register("", AdminGameViewSet, basename="admin-game")

urlpatterns = router.urls
