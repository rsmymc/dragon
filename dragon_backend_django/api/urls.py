from django.urls import path, include
from rest_framework.routers import DefaultRouter

from api.views.attendance import session_roster, mark_attendance, mark_my_attendance
from .views import PersonViewSet, TeamViewSet, MembershipViewSet, LocationViewSet, TrainingViewSet, LineupViewSet, \
    LineupSeatViewSet
from api.views.auth import me, register

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
    path('auth/register/', register, name='register'),
    path('training/<int:training_id>/roster/', session_roster, name='session-roster'),
    path('training/<int:training_id>/attendance/me/', mark_my_attendance, name='attendance-me'),
    path('attendance/mark/', mark_attendance, name='attendance-mark'),
]