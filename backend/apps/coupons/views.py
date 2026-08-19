from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cart.services import get_or_create_cart
from common.permissions import IsAnyAdmin

from .models import Coupon
from .serializers import ApplyCouponSerializer, CouponSerializer


class AdminCouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAnyAdmin]


class ValidateCouponView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ApplyCouponSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        code = serializer.validated_data["code"]

        coupon = Coupon.objects.filter(code__iexact=code).first()
        if not coupon or not coupon.is_valid():
            return Response({"valid": False, "detail": "Coupon is invalid or expired."}, status=400)

        cart = get_or_create_cart(request)
        discount = coupon.compute_discount(cart.subtotal)
        return Response(
            {
                "valid": True,
                "coupon": CouponSerializer(coupon).data,
                "discount_amount": discount,
                "new_total": cart.subtotal - discount,
            }
        )
