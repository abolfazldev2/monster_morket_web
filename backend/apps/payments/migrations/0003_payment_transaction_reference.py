from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [("payments", "0002_initial")]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="transaction_reference",
            field=models.CharField(blank=True, max_length=128),
        ),
    ]
