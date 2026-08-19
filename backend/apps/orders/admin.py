from django.contrib import admin

from .models import Order, OrderAdminNote, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product", "variant", "quantity", "unit_price", "subtotal", "customer_data")


class OrderAdminNoteInline(admin.TabularInline):
    model = OrderAdminNote
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "total", "created_at")
    list_filter = ("status",)
    search_fields = ("order_number", "user__username", "user__email")
    inlines = [OrderItemInline, OrderAdminNoteInline]
