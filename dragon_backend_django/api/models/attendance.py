from django.db import models
from .base import TimeStampedModel


class Attendance(TimeStampedModel):
    membership = models.ForeignKey(
        "Membership",
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    training = models.ForeignKey(
        "Training",
        on_delete=models.CASCADE,
        related_name="attendances",
    )
    attended = models.BooleanField(default=False)

    class Meta:
        db_table = "attendance"
        constraints = [
            models.UniqueConstraint(
                fields=["membership", "training"],
                name="unique_membership_training",
            )
        ]
        ordering = ["training", "membership"]

    def __str__(self):
        return f"{self.membership} @ {self.training} — {'present' if self.attended else 'absent'}"