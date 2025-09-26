from django.db import IntegrityError
from rest_framework import serializers
from ..models import Person, Team, Membership
from .person import PersonCompactSerializer
from .team import TeamCompactSerializer


class MembershipSerializer(serializers.ModelSerializer):
    # Write with PKs; expose nested details for convenience on reads
    person = serializers.PrimaryKeyRelatedField(queryset=Person.objects.all())
    team = serializers.PrimaryKeyRelatedField(queryset=Team.objects.all())
    class Meta:
        model = Membership
        fields = [
            "id",
            "person",
            "team",
            "role",
            "created_at",
            "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at", "person_detail", "team_detail"]

    # ------- Validation helpers -------
    def _validate_capacity(self, team: Team, *, exclude_pk=None):
        """
        Team capacity check for *current* members.
        Since this is a current-state model, current members = all Membership rows of the team.
        """
        capacity = team.max_members  # default 22
        if capacity is None:
            return

        qs = Membership.objects.filter(team=team)
        if exclude_pk is not None:
            qs = qs.exclude(pk=exclude_pk)

        current_count = qs.count()
        if current_count >= capacity:
            raise serializers.ValidationError(
                {"team": [f"Team is at capacity ({capacity}). Cannot add another member."]}
            )

    def validate(self, attrs):
        # On create, attrs has person+team; on update, merge with instance
        person = attrs.get("person", getattr(self.instance, "person", None))
        team = attrs.get("team", getattr(self.instance, "team", None))

        # Capacity applies when the record will (continue to) exist for this team.
        # For updates that don't change team/person, exclude self from the count.
        exclude_pk = getattr(self.instance, "pk", None)
        if person and team:
            self._validate_capacity(team, exclude_pk=exclude_pk)

        return attrs

        # -------- Create / Update with friendly DB error handling --------

    def create(self, validated_data):
        try:
            return super().create(validated_data)
        except IntegrityError:
            # Raised by DB unique constraint on (person, team)
            raise serializers.ValidationError(
                {"non_field_errors": ["This person is already a member of the specified team."]}
            )

    def update(self, instance, validated_data):
        try:
            return super().update(instance, validated_data)
        except IntegrityError:
            raise serializers.ValidationError(
                {"non_field_errors": ["This person is already a member of the specified team."]}
            )

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["person"] = PersonCompactSerializer(instance.person).data
        rep["team"] = TeamCompactSerializer(instance.team).data
        return rep

class MembershipNestedSerializer(serializers.ModelSerializer):
    person = PersonCompactSerializer(read_only=True)
    team = TeamCompactSerializer(read_only=True)

    class Meta:
        model = Membership
        fields = [
            "id",
            "person",
            "team",
            "role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
