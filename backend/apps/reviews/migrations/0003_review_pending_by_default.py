from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("reviews", "0002_initial")]

    operations = [
        migrations.AlterField(
            model_name="review",
            name="is_approved",
            field=models.BooleanField(default=False),
        ),
    ]
