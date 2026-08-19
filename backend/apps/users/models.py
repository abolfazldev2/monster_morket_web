from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model so roles are a first-class field rather than bolted
    on via groups. CUSTOMER is the default for public registration —
    admin roles are only ever assigned by an existing SUPER_ADMIN.
    """

    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "Customer"
        SUPPORT = "SUPPORT", "Support"
        FULFILLMENT_ADMIN = "FULFILLMENT_ADMIN", "Fulfillment Admin"
        SUPER_ADMIN = "SUPER_ADMIN", "Super Admin"

    role = models.CharField(max_length=32, choices=Role.choices, default=Role.CUSTOMER)
    email = models.EmailField(unique=True)
    is_email_verified = models.BooleanField(default=False)
    preferred_language = models.CharField(max_length=8, default="en")

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return self.username

    @property
    def is_admin(self):
        return self.role != self.Role.CUSTOMER


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reset_tokens")
    token = models.CharField(max_length=128, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used_at = models.DateTimeField(null=True, blank=True)

    def is_valid(self):
        return self.used_at is None
