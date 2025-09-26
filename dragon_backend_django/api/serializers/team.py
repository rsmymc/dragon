from rest_framework import serializers
from ..models import Team, Membership


class TeamSerializer(serializers.ModelSerializer):
    active_member_count = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "city",
            "max_members",
            "active_member_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at", "active_member_count"]

    def get_active_member_count(self, obj: Team) -> int:
        return Membership.objects.filter(team=obj).count()


class TeamCompactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "city", "max_members"]
