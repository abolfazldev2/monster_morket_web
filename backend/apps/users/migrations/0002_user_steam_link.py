from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("users", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="user",
            name="steam_id64",
            field=models.CharField(blank=True, max_length=17, null=True, unique=True),
        ),
        migrations.AddField(
            model_name="user",
            name="steam_trade_url",
            field=models.URLField(blank=True, max_length=500),
        ),
    ]
