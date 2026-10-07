from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("fulfillment", "0002_initial")]

    operations = [
        migrations.AddField(
            model_name="fulfillment",
            name="steam_trade_url",
            field=models.URLField(blank=True, max_length=500),
        ),
    ]
