from django.db import models
from . import Person
from .base import TimeStampedModel
from .training import Training


class LineupState(models.IntegerChoices):
    DRAFT = 1, "Draft"
    PUBLISHED = 2, "Published"


class Lineup(TimeStampedModel):
    """
    Header for a training's lineup.
    One lineup per training.
    """

    id = models.BigAutoField(primary_key=True)
    training = models.OneToOneField(
        Training,
        on_delete=models.CASCADE,
        related_name="lineup",
        db_index=True,
    )
    state = models.SmallIntegerField(choices=LineupState.choices, default=LineupState.DRAFT)

    class Meta:
        db_table = "lineup"
        indexes = [models.Index(fields=["state"])]

    def __str__(self):
        return f"Lineup #{self.id} for training {self.training_id} (state={self.get_state_display()})"


class LineupSeat(TimeStampedModel):
    """
    One row per seat assignment.
    person can be null for unassigned seats.

    Sides:
      - "L" / "R": paddling seats, positioned by seat_number (1..N).
      - "D": Drummer (single, front).      seat_number is fixed at 1.
      - "S": Steerer / sweep (single, back). seat_number is fixed at 1.

    Constraints:
      - A seat (side, seat_number) is unique within a lineup.
      - There is at most one Drummer and one Steerer per lineup.
      - A person can appear at most once within the same lineup.
    """

    id = models.BigAutoField(primary_key=True)
    lineup = models.ForeignKey(
        Lineup, on_delete=models.CASCADE, related_name="seats", db_index=True
    )
    person = models.ForeignKey(
        Person,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="lineup_seats",
    )

    SIDE_CHOICES = (
        ("L", "Left"),
        ("R", "Right"),
        ("D", "Drummer"),
        ("S", "Steerer"),
    )
    # roles that are single, non-paddling positions
    SPECIAL_SIDES = ("D", "S")

    side = models.CharField(max_length=1, choices=SIDE_CHOICES)
    seat_number = models.SmallIntegerField()  # 1..N for L/R; 1 for D/S

    class Meta:
        db_table = "lineup_seat"
        constraints = [
            models.UniqueConstraint(
                fields=["lineup", "side", "seat_number"],
                name="uq_lineup_side_seat",
            ),
            # At most one drummer and one steerer per lineup, regardless of seat_number
            models.UniqueConstraint(
                fields=["lineup", "side"],
                condition=models.Q(side__in=["D", "S"]),
                name="uq_lineup_single_special",
            ),
            models.UniqueConstraint(
                fields=["lineup", "person"],
                name="uq_lineup_person_once",
                condition=models.Q(person__isnull=False),
            ),
        ]
        indexes = [
            models.Index(fields=["lineup", "side"]),
            models.Index(fields=["lineup", "person"]),
        ]

    def __str__(self):
        who = self.person_id or "empty"
        return f"[{self.side}{self.seat_number}] in lineup {self.lineup_id} -> {who}"