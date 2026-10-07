from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.conf import settings

from apps.games.models import Category, Game
from common.models import TimeStampedModel


class DeliveryMethod(models.TextChoices):
    STEAM_GIFT = "STEAM_GIFT", "Steam Gift"
    STEAM_TRADE = "STEAM_TRADE", "Steam Trade"
    GAME_CODE = "GAME_CODE", "Game Code"
    MANUAL_ACTIVATION = "MANUAL_ACTIVATION", "Manual Activation"


class Product(TimeStampedModel):
    """
    The single generic product model for every game/product type. Never
    subclassed per game — game/category/required-fields/delivery-method
    are what differentiate a Dota 2 item from a WoW Game Time bundle, not
    the schema.
    """

    game = models.ForeignKey(Game, on_delete=models.PROTECT, related_name="products")
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    product_type = models.CharField(max_length=50, help_text="e.g. item, subscription, game_time")
    base_price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    currency = models.CharField(max_length=8, default="USD")
    stock = models.PositiveIntegerField(null=True, blank=True, help_text="null = unlimited/digital")
    is_active = models.BooleanField(default=True)
    delivery_method = models.CharField(max_length=32, choices=DeliveryMethod.choices)
    cover_image = models.ImageField(upload_to="products/covers/", null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_best_seller = models.BooleanField(default=False)
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="marketplace_listings",
    )
    is_marketplace_listing = models.BooleanField(default=False)
    seller_approved = models.BooleanField(default=False)
    wear = models.CharField(max_length=32, blank=True)
    float_value = models.DecimalField(
        max_digits=8, decimal_places=6, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(1)],
    )
    rarity = models.CharField(max_length=64, blank=True)
    stickers = models.JSONField(default=list, blank=True)
    pattern_id = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["game", "category"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return self.name

    @property
    def in_stock(self):
        return self.stock is None or self.stock > 0


class ProductVariant(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    name = models.CharField(max_length=100, help_text='e.g. "30 Days", "3 Months"')
    price_override = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(null=True, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.product.name} — {self.name}"

    @property
    def price(self):
        return self.price_override if self.price_override is not None else self.product.base_price


class ProductTranslation(models.Model):
    class Language(models.TextChoices):
        EN = "en", "English"
        FA = "fa", "Persian"
        AR = "ar", "Arabic"
        RU = "ru", "Russian"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="translations")
    language_code = models.CharField(max_length=8, choices=Language.choices)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    class Meta:
        unique_together = [("product", "language_code")]

    def __str__(self):
        return f"{self.product.slug} [{self.language_code}]"


class ProductRequiredField(TimeStampedModel):
    """
    Defines what customer information a product needs at checkout. The
    frontend renders these dynamically — no product-specific checkout
    forms are ever hand-written.
    """

    class FieldType(models.TextChoices):
        TEXT = "text", "Text"
        URL = "url", "URL"
        SELECT = "select", "Select"

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="required_fields")
    field_key = models.CharField(
        max_length=64, help_text="e.g. steam_profile_url, battlenet_account, region, faceit_username"
    )
    label = models.CharField(max_length=150)
    field_type = models.CharField(max_length=16, choices=FieldType.choices, default=FieldType.TEXT)
    is_required = models.BooleanField(default=True)
    validation_regex = models.CharField(max_length=300, blank=True)
    options = models.JSONField(null=True, blank=True, help_text="For select fields: list of {value, label}")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]
        unique_together = [("product", "field_key")]

    def __str__(self):
        return f"{self.product.slug}: {self.field_key}"
