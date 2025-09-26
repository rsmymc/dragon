from rest_framework import serializers
from ..models import Location, Team
from .team import TeamCompactSerializer


class LocationSerializer(serializers.ModelSerializer):
    team = serializers.PrimaryKeyRelatedField(queryset=Team.objects.all())

    class Meta:
        model = Location
        fields = ["id", "team", "name", "lat", "lon", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep["team"] = TeamCompactSerializer(instance.team).data
        return rep


class LocationCompactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name", "lat", "lon"]
