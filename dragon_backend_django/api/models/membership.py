import uuid
from django.db import models
from .base import TimeStampedModel
from .person import Person
from .team import Team


class Membership(TimeStampedModel):
    """Person <-> Team membership (a.k.a. PersonTeam)."""
    class Role(models.IntegerChoices):
        PLAYER = 1, "Player"
        CAPTAIN = 2, "Captain"
        COACH = 3, "Coach"
        MANAGER = 4, "Manager"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    person = models.ForeignKey(Person, on_delete=models.CASCADE, related_name="memberships")
    team = models.ForeignKey(Team, on_delete=models.CASCADE, related_name="memberships")
    role = models.IntegerField(choices=Role.choices, default=Role.PLAYER)

    class Meta:
        db_table = "person_team"
        constraints = [
            models.UniqueConstraint(fields=["person", "team"], name="uq_person_team_once"),
        ]
        indexes = [
            models.Index(fields=["team"]),
            models.Index(fields=["person"]),
        ]

    def __str__(self):
        return f"{self.person} @ {self.team} ({self.get_role_display()})"
