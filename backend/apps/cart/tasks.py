from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from .models import Cart


@shared_task
def cleanup_expired_carts():
    """Guest carts older than 30 days with no matching session are pruned."""
    cutoff = timezone.now() - timedelta(days=30)
    Cart.objects.filter(user__isnull=True, updated_at__lt=cutoff).delete()
