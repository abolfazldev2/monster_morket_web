import django.db.models.deletion
import django.core.validators
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("products", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="seller",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="marketplace_listings",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="is_marketplace_listing",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="product",
            name="seller_approved",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="product",
            name="wear",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="product",
            name="float_value",
            field=models.DecimalField(
                blank=True,
                decimal_places=6,
                max_digits=8,
                null=True,
                validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(1)],
            ),
        ),
        migrations.AddField(
            model_name="product",
            name="rarity",
            field=models.CharField(blank=True, max_length=64),
        ),
        migrations.AddField(
            model_name="product",
            name="stickers",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="product",
            name="pattern_id",
            field=models.PositiveIntegerField(blank=True, null=True),
        ),
    ]
