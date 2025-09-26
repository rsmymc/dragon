import uuid
from django.db import models
from .base import TimeStampedModel


class Team(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    max_members = models.PositiveIntegerField(default=22, blank=True)

    class Meta:
        db_table = "team"
        ordering = ["name", "id"]

    def __str__(self):
        return f"{self.name} ({self.id})"
