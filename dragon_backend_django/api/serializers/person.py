from rest_framework import serializers
from ..models import Person


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = [
            "id",
            "name",
            "phone",
            "height",
            "weight",
            "side",
            "profile_picture_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class PersonCompactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person
        fields = ["id", "name", "phone"]
