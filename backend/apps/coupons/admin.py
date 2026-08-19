from django.contrib import admin

from .models import Coupon, Discount


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "value", "times_used", "max_uses", "is_active")
    search_fields = ("code",)


@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ("product", "percentage_off", "starts_at", "ends_at", "is_active")
