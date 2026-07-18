from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Team
from ..serializers import TeamSerializer


class TeamViewSet(viewsets.ModelViewSet):
    """
    CRUD for teams.
    """
    queryset = Team.objects.all().order_by("name", "id")
    serializer_class = TeamSerializer

    # Filtering / search / ordering
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ["city"]
    search_fields = ["name", "city"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]

    @action(detail=False, methods=["get"], permission_classes=[IsAuthenticated])
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