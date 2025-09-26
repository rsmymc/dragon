from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from ..models import Training
from ..serializers.training import TrainingSerializer


class TrainingViewSet(viewsets.ModelViewSet):
    queryset = Training.objects.select_related("team", "location").all()
    serializer_class = TrainingSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = {
        "team": ["exact"],
        "location": ["exact"],
        "start_at": ["gte", "lte", "date", "date__gte", "date__lte"],
    }
    search_fields = ["team__name", "location__name"]
    ordering_fields = ["start_at", "created_at", "updated_at"]
    ordering = ["-start_at"]
