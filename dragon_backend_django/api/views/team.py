from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Team, Membership, Person
from ..serializers import TeamSerializer


class TeamViewSet(viewsets.ModelViewSet):
    """
    CRUD for teams, plus:
    - my_teams: teams the current user belongs to.
    - join: join a team by its share code.
    Creating a team auto-adds the creator as a member (role: Manager).
    """
    queryset = Team.objects.all().order_by("name", "id")
    serializer_class = TeamSerializer
    permission_classes = [IsAuthenticated]

    # Filtering / search / ordering
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ["city"]
    search_fields = ["name", "city"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]

    def _current_person(self):
        try:
            return self.request.user.person
        except Person.DoesNotExist:
            return None

    @transaction.atomic
    def perform_create(self, serializer):
        person = self._current_person()
        if person is None:
            raise ValidationError("No person profile is linked to this account.")
        team = serializer.save()
        Membership.objects.create(
            person=person,
            team=team,
            role=Membership.Role.MANAGER,
        )

    @action(detail=False, methods=["get"])
    def my_teams(self, request):
        """
        GET /api/v1/team/my_teams/
        Teams the current user belongs to, via Membership -> Person -> User.
        """
        qs = (
            self.get_queryset()
            .filter(memberships__person__user=request.user)
            .distinct()
        )
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page or qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def join(self, request):
        """
        POST /api/v1/team/join/   body: { "code": "ABC123" }
        Joins the current user's Person to the team with that code.
        """
        code = (request.data.get("code") or "").strip().upper()
        if not code:
            return Response(
                {"detail": "code is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            team = Team.objects.get(code=code)
        except Team.DoesNotExist:
            return Response(
                {"detail": "Invalid team code"},
                status=status.HTTP_404_NOT_FOUND,
            )

        person = self._current_person()
        if person is None:
            return Response(
                {"detail": "No person profile is linked to this account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership, created = Membership.objects.get_or_create(
            person=person,
            team=team,
            defaults={"role": Membership.Role.PLAYER},
        )
        if not created:
            return Response(
                {"detail": "You are already a member of this team."},
                status=status.HTTP_409_CONFLICT,
            )

        serializer = self.get_serializer(team)
        return Response(serializer.data, status=status.HTTP_201_CREATED)