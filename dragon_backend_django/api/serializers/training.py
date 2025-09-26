from rest_framework import serializers
from ..models import Training, Team, Location
from .team import TeamCompactSerializer
from .location import LocationCompactSerializer


class TrainingSerializer(serializers.ModelSerializer):
    team = serializers.PrimaryKeyRelatedField(queryset=Team.objects.all())
    location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all())

    class Meta:
        model = Training
        fields = ["id", "team", "location", "start_at", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        # simple sanity: ensure location belongs to the same team
        team = attrs.get("team", getattr(self.instance, "team", None))
        location = attrs.get("location", getattr(self.instance, "location", None))
        if team and location and location.team_id != team.id:
            raise serializers.ValidationError({"location": ["Location must belong to the same team."]})
        return attrs

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["team"] = TeamCompactSerializer(instance.team).data
        rep["location"] = LocationCompactSerializer(instance.location).data
        return rep
