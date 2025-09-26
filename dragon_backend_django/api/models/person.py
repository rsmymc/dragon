import uuid
from django.db import models
from django.conf import settings
from .base import TimeStampedModel


class Person(TimeStampedModel):
    class Side(models.IntegerChoices):
        BOTH = 0, "Both"
        LEFT = 1, "Left"
        RIGHT = 2, "Right"


    # Link the auth identity to your profile (nullable so you can backfill)
    # user = models.OneToOneField(
    #     settings.AUTH_USER_MODEL,
    #     on_delete=models.CASCADE,
    #     related_name="person_profile",
    #     null=True,
    #     blank=True,
    # )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, blank=False, null=False)
    phone = models.CharField(max_length=15, db_index=True, blank=False, null=False)
    height = models.SmallIntegerField(null=True, blank=True)  # cm
    weight = models.SmallIntegerField(null=True, blank=True)  # kg
    side = models.SmallIntegerField(choices=Side.choices, default=Side.BOTH)
    profile_picture_url = models.CharField(max_length=250, blank=True)

    class Meta:
        db_table = "person"
        indexes = [
            models.Index(fields=["phone"]),
            models.Index(fields=["name"]),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(height__gte=0), name="ck_person_height_nonneg"),
            models.CheckConstraint(check=models.Q(weight__gte=0), name="ck_person_weight_nonneg"),
        ]

    def __str__(self):
        return self.name or str(self.id)
