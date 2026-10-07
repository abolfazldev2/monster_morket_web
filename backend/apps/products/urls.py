from rest_framework.routers import DefaultRouter

from .views import ProductViewSet
from .seller_views import SellerListingViewSet, SellerSaleViewSet

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")

urlpatterns = router.urls

seller_router = DefaultRouter()
seller_router.register("listings", SellerListingViewSet, basename="seller-listing")
seller_router.register("sales", SellerSaleViewSet, basename="seller-sale")
