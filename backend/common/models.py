from django.conf import settings
from django.db import models


class TimeStampedModel(models.Model):
    """Abstract base — every domain model gets created_at/updated_at for free."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditLog(models.Model):
    """
    Every meaningful admin action gets written here — payment confirmation,
    order cancellation, refunds, price/stock changes, user suspension,
    fulfillment transitions. Written in the same transaction as the action
    it records, never as an afterthought.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="audit_logs"
    )
    action = models.CharField(max_length=100)
    target_model = models.CharField(max_length=100)
    target_id = models.CharField(max_length=64)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["target_model", "target_id"]),
            models.Index(fields=["-created_at"]),
        ]

    def __str__(self):
        return f"{self.user}: {self.action} on {self.target_model}#{self.target_id}"

    @classmethod
    def record(cls, *, user, action, target, old_value=None, new_value=None, ip_address=None):
        return cls.objects.create(
            user=user,
            action=action,
            target_model=target.__class__.__name__,
            target_id=str(target.pk),
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
        )
