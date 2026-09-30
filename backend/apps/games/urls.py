from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, GameViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("", GameViewSet, basename="game")

urlpatterns = router.urls
