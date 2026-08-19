from django.db import models

from common.models import TimeStampedModel


class Game(TimeStampedModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    icon = models.ImageField(upload_to="games/icons/", null=True, blank=True)
    banner_image = models.ImageField(upload_to="games/banners/", null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class Category(TimeStampedModel):
    game = models.ForeignKey(Game, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)
    slug = models.SlugField()
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "name"]
        unique_together = [("game", "slug")]
        verbose_name_plural = "categories"

    def __str__(self):
        return f"{self.game.name} / {self.name}"
