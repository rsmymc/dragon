from rest_framework import serializers
from api.models.attendance import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    """Single attendance row — used for plain read/write of one record."""

    class Meta:
        model = Attendance
        fields = ["id", "membership", "training", "attended"]
        read_only_fields = ["id"]


class AttendanceMarkSerializer(serializers.Serializer):
    membership = serializers.UUIDField()   
    attended = serializers.BooleanField()


class AttendanceBulkSerializer(serializers.Serializer):
    training = serializers.IntegerField()
    marks = AttendanceMarkSerializer(many=True)

class SessionRosterSerializer(serializers.Serializer):
    """Outgoing merged row for option B: one roster member + their state.

    attended is True / False / null (null = not recorded yet).
    """

    membership = serializers.UUIDField()
    person_name = serializers.CharField()
    attended = serializers.BooleanField(allow_null=True)