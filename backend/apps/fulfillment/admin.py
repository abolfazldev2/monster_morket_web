from django.contrib import admin

from .models import Fulfillment, FulfillmentNote


class FulfillmentNoteInline(admin.TabularInline):
    model = FulfillmentNote
    extra = 0


@admin.register(Fulfillment)
class FulfillmentAdmin(admin.ModelAdmin):
    list_display = ("order_item", "delivery_method", "status", "assigned_admin", "created_at")
    list_filter = ("status", "delivery_method")
    inlines = [FulfillmentNoteInline]
