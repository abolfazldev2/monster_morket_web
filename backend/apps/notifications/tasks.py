from celery import shared_task


@shared_task
def create_notification_task(user_id, notification_type, title, message="", order_id=None):
    from .models import Notification

    Notification.objects.create(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        related_order_id=order_id,
    )
