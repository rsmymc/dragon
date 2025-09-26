from rest_framework import viewsets
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
