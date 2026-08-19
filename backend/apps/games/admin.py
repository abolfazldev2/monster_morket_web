from django.contrib import admin

from .models import Category, Game


class CategoryInline(admin.TabularInline):
    model = Category
    extra = 1


@admin.register(Game)
class GameAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "is_active", "sort_order")
    prepopulated_fields = {"slug": ("name",)}
    inlines = [CategoryInline]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "game", "slug", "sort_order")
    list_filter = ("game",)
