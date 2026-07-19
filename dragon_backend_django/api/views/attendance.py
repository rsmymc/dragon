from api.serializers.attendance import SessionRosterSerializer, AttendanceBulkSerializer

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.models import Training, Membership, Attendance


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def session_roster(request, training_id):
    """Return the team roster merged with attendance state.

    Each row: { membership, person_name, attended (True/False/null) }.
    null = no attendance recorded yet for this member in this session.
    """
    training = get_object_or_404(Training, pk=training_id)

    memberships = (
        Membership.objects
        .filter(team=training.team)
        .select_related("person")
    )

    # Existing attendance rows for this session, keyed by membership id.
    recorded = {
        a.membership_id: a.attended
        for a in Attendance.objects.filter(training=training)
    }

    rows = [
        {
            "membership": m.id,
            "person_name": m.person.name,
            "attended": recorded.get(m.id),  # None if not recorded yet
        }
        for m in memberships
    ]

    serializer = SessionRosterSerializer(rows, many=True)
    return Response(serializer.data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_attendance(request):
    """Bulk upsert attendance marks for one session (coach/captain/manager only).

    Payload: { "training": <int>, "marks": [ {"membership": "<uuid>", "attended": bool}, ... ] }
    """
    serializer = AttendanceBulkSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    training = get_object_or_404(Training, pk=data["training"])

    # --- authorization: caller must be CAPTAIN, COACH, or MANAGER of this team ---
    person = getattr(request.user, "person", None)
    caller_membership = (
        Membership.objects
        .filter(person=person, team=training.team)
        .first()
        if person else None
    )
    allowed_roles = {
        Membership.Role.CAPTAIN,
        Membership.Role.COACH,
        Membership.Role.MANAGER,
    }
    if caller_membership is None or caller_membership.role not in allowed_roles:
        return Response(
            {"detail": "Only a captain, coach, or manager can mark the team."},
            status=status.HTTP_403_FORBIDDEN,
        )
    # --- end authorization ---

    # Restrict to memberships that actually belong to this training's team,
    # so a bad payload can't attach attendance to the wrong team.
    valid_membership_ids = set(
        Membership.objects
        .filter(team=training.team)
        .values_list("id", flat=True)
    )

    to_update = []
    skipped = []
    for mark in data["marks"]:
        if mark["membership"] not in valid_membership_ids:
            skipped.append(str(mark["membership"]))
            continue
        obj, _ = Attendance.objects.update_or_create(
            training=training,
            membership_id=mark["membership"],
            defaults={"attended": mark["attended"]},
        )
        to_update.append(obj)

    return Response(
        {
            "training": training.id,
            "updated": len(to_update),
            "skipped": skipped,  # memberships not on this team, if any
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_my_attendance(request, training_id):
    """A logged-in member marks their OWN attendance for one training.

    Payload: { "attended": bool }
    The membership is derived from request.user — never from the payload —
    so a member can only ever touch their own row.
    """
    attended = request.data.get("attended")
    if not isinstance(attended, bool):
        return Response(
            {"detail": "Field 'attended' (boolean) is required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    training = get_object_or_404(Training, pk=training_id)

    # Resolve the caller's person, then their membership on THIS training's team.
    person = getattr(request.user, "person", None)
    if person is None:
        return Response(
            {"detail": "No person linked to this account."},
            status=status.HTTP_403_FORBIDDEN,
        )

    membership = (
        Membership.objects
        .filter(person=person, team=training.team)
        .first()
    )
    if membership is None:
        return Response(
            {"detail": "You are not a member of this team."},
            status=status.HTTP_403_FORBIDDEN,
        )

    obj, _ = Attendance.objects.update_or_create(
        training=training,
        membership=membership,
        defaults={"attended": attended},
    )

    return Response(
        {
            "training": training.id,
            "membership": str(membership.id),
            "attended": obj.attended,
        },
        status=status.HTTP_200_OK,
    )