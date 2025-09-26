from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import OrderingFilter, SearchFilter
from django_filters.rest_framework import DjangoFilterBackend

from ..models import Membership
from ..serializers import (
    MembershipSerializer,
    MembershipNestedSerializer,
)


class MembershipViewSet(viewsets.ModelViewSet):
    """
    Current-state memberships:
    - One row per (person, team), enforced by DB unique constraint.
    """
    queryset = (
        Membership.objects.select_related("person", "team")
        .all()
        .order_by("-created_at", "id")
    )
    # Filtering / search / ordering
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ["team", "person", "role"]
    search_fields = ["person__name", "team__name"]
    ordering_fields = ["created_at", "updated_at", "role"]
    ordering = ["-created_at"]

    # Use nested serializer for reads; flat serializer for writes
    def get_serializer_class(self):
        if self.action in {"list", "retrieve"}:
            return MembershipNestedSerializer
        return MembershipSerializer
