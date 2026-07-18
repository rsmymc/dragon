from rest_framework import serializers
from ..models import Person
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.contrib.auth import get_user_model


User = get_user_model()

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    name = serializers.CharField(max_length=50)
    phone = serializers.CharField(max_length=15, required=False, allow_null=True)
    height = serializers.IntegerField(required=False, allow_null=True)
    weight = serializers.IntegerField(required=False, allow_null=True)
    side = serializers.ChoiceField(
        choices=Person.Side.choices, required=False, default=Person.Side.BOTH
    )

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        username = validated_data.pop("username")
        with transaction.atomic():
            user = User.objects.create_user(username=username, password=password)
            person = Person.objects.create(user=user, **validated_data)
        return person

