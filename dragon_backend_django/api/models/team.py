import uuid
import secrets
from django.db import models
from .base import TimeStampedModel


# Unambiguous alphabet: no O/0, I/1, L — easier to read and type off a screen
TEAM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_team_code(length=6):
    return "".join(secrets.choice(TEAM_CODE_ALPHABET) for _ in range(length))


class Team(TimeStampedModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    city = models.CharField(max_length=255, blank=True, null=True)
    max_members = models.PositiveIntegerField(default=22, blank=True)
    code = models.CharField(max_length=8, unique=True, blank=True, db_index=True)

    class Meta:
        db_table = "team"
        ordering = ["name", "id"]

    def __str__(self):
        return f"{self.name} ({self.id})"

    def save(self, *args, **kwargs):
        if not self.code:
            while True:
                candidate = generate_team_code()
                if not Team.objects.filter(code=candidate).exists():
                    self.code = candidate
                    break
        super().save(*args, **kwargs)