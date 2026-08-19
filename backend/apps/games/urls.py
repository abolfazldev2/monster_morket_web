from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, GameViewSet

router = DefaultRouter()
router.register("", GameViewSet, basename="game")
router.register("categories", CategoryViewSet, basename="category")

urlpatterns = router.urls
