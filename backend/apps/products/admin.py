from django.contrib import admin

from .models import Product, ProductRequiredField, ProductTranslation, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductTranslationInline(admin.TabularInline):
    model = ProductTranslation
    extra = 1


class ProductRequiredFieldInline(admin.TabularInline):
    model = ProductRequiredField
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "game", "category", "base_price", "stock", "is_active", "delivery_method")
    list_filter = ("game", "category", "is_active", "delivery_method")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [ProductVariantInline, ProductTranslationInline, ProductRequiredFieldInline]
