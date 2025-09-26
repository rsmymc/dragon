from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Person
from ..serializers import PersonSerializer


class PersonViewSet(viewsets.ModelViewSet):
    """
    CRUD for people.
    """
    queryset = Person.objects.all().order_by("name", "id")
    serializer_class = PersonSerializer

    # Filtering / search / ordering
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ["side"]
    search_fields = ["name", "phone"]
    ordering_fields = ["name", "created_at", "updated_at"]
    ordering = ["name"]
