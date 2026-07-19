
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from api.serializers.register import RegisterSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    person = getattr(user, "person", None)
    return Response({
        "id": user.id,
        "username": user.get_username(),
        "email": getattr(user, "email", ""),
        "is_staff": getattr(user, "is_staff", False),
        "is_superuser": getattr(user, "is_superuser", False),
        "person": {
            "id": str(person.id),
            "name": person.name,
        } if person else None,
    })

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    person = serializer.save()

    refresh = RefreshToken.for_user(person.user)
    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {"id": person.user.id, "username": person.user.username},
            "person": {"id": str(person.id), "name": person.name},
        },
        status=status.HTTP_201_CREATED,
    )