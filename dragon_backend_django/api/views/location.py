from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Location
from ..serializers.location import LocationSerializer

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.select_related("team").all()
    serializer_class = LocationSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = {"team": ["exact"]}
    search_fields = ["name", "team__name"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]
