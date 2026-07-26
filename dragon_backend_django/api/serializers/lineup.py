from rest_framework import serializers
from ..models import Lineup, LineupSeat, Training, Person, LineupState
from .training import TrainingSerializer
from .person import PersonSerializer


class LineupSerializer(serializers.ModelSerializer):
    training = serializers.PrimaryKeyRelatedField(queryset=Training.objects.all())
    seats = serializers.SerializerMethodField()
    state = serializers.ChoiceField(choices=LineupState.choices, default=LineupState.DRAFT)

    class Meta:
        model = Lineup
        fields = [
            "id",
            "training",
            "state",
            "seats",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_seats(self, obj):
        seats = obj.seats.all().order_by("side", "seat_number")
        return LineupSeatSerializer(seats, many=True).data

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["training"] = TrainingSerializer(instance.training).data
        # Add human-readable label for state
        rep["state_display"] = instance.get_state_display()
        return rep


class LineupSeatSerializer(serializers.ModelSerializer):
    # write with PKs; read nested person
    lineup = serializers.PrimaryKeyRelatedField(queryset=Lineup.objects.all())
    person = serializers.PrimaryKeyRelatedField(
        queryset=Person.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = LineupSeat
        fields = [
            "id",
            "lineup",
            "person",
            "side",
            "seat_number",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        # Drummer / Steerer are single positions - pin them to seat_number 1
        side = attrs.get("side", getattr(self.instance, "side", None))
        if side in LineupSeat.SPECIAL_SIDES:
            attrs["seat_number"] = 1
        return attrs

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["side_display"] = instance.get_side_display()
        if instance.person_id:
            rep["person"] = PersonSerializer(instance.person).data
        return rep