from django.db import models
from .team import Team
from .base import TimeStampedModel

class Location(TimeStampedModel):

    id = models.AutoField(primary_key=True)
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="locations")
    lat = models.FloatField()
    lon = models.FloatField()
    name = models.CharField(max_length=255)

    class Meta:
        db_table = "location"
        indexes = [
            models.Index(fields=["team"]),
        ]
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.lat:.5f}, {self.lon:.5f})"