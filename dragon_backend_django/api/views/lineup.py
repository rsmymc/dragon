from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Lineup, LineupSeat
from ..serializers.lineup import LineupSerializer, LineupSeatSerializer


class LineupViewSet(viewsets.ModelViewSet):
    """
    CRUD for Lineup (header per training).
    """
    queryset = Lineup.objects.select_related("training").prefetch_related("seats").all().order_by("-updated_at")
    serializer_class = LineupSerializer

    http_method_names = ["get", "post", "put", "patch", "delete", "options", "head"]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["training", "state"]
    ordering_fields = ["updated_at", "created_at", "id"]


class LineupSeatViewSet(viewsets.ModelViewSet):
    """
    CRUD for LineupSeat (one row per seat assignment).
    """
    queryset = LineupSeat.objects.select_related("lineup", "person", "lineup__training").all().order_by("lineup_id", "side", "seat_number")
    serializer_class = LineupSeatSerializer

    http_method_names = ["get", "post", "put", "patch", "delete", "options", "head"]

    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["lineup", "side", "seat_number", "person"]
    ordering_fields = ["lineup", "side", "seat_number", "updated_at"]
