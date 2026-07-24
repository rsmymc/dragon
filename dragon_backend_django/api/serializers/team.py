from rest_framework import serializers
from ..models import Team, Membership


class TeamSerializer(serializers.ModelSerializer):
    active_member_count = serializers.SerializerMethodField()
    my_role = serializers.SerializerMethodField()

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "city",
            "max_members",
            "code",
            "active_member_count",
            "my_role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "code", "created_at", "updated_at", "active_member_count"]

    def get_active_member_count(self, obj: Team) -> int:
        return Membership.objects.filter(team=obj).count()
    def get_my_role(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        membership = obj.memberships.filter(person__user=request.user).first()
        return membership.role if membership else None

class TeamCompactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Team
        fields = ["id", "name", "city", "max_members", "code"]