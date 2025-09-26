from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PersonViewSet, TeamViewSet, MembershipViewSet, LocationViewSet, TrainingViewSet, LineupViewSet, \
    LineupSeatViewSet
from api.views.auth import me

router = DefaultRouter()
router.register("person", PersonViewSet, basename="person")
router.register("team", TeamViewSet, basename="team")
router.register("membership", MembershipViewSet, basename="membership")
router.register("location", LocationViewSet, basename="location")
router.register("training", TrainingViewSet, basename="training")
router.register("lineup", LineupViewSet, basename="lineup")
router.register("lineup-seat", LineupSeatViewSet, basename="lineup-seat")

urlpatterns = [
    path('', include(router.urls)),
    path('auth/me/', me, name='auth-me'),
]
