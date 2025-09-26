from django.db import models

from .location import Location
from .team import Team
from .base import TimeStampedModel

class Training(TimeStampedModel):

    id = models.SmallAutoField(primary_key=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="trainings")
    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="trainings")
    start_at = models.DateTimeField()

    class Meta:
        db_table = "training"
        indexes = [
            models.Index(fields=["team", "start_at"]),
            models.Index(fields=["start_at"]),
        ]
        ordering = ["-start_at", "-created_at"]

    def __str__(self) -> str:
        return f"Training – {self.team.name} @ {self.start_at:%Y-%m-%d %H:%M}"
