from django.contrib import admin
from .models import Person, Team, Membership, Location, Training, Lineup, LineupSeat


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "phone", "side", "created_at")
    search_fields = ("name", "phone")
    list_filter = ("side",)


@admin.register(Team)
class TeamAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "city", "max_members", "created_at")
    search_fields = ("name", "city")
    list_filter = ("name", "city")

@admin.register(Membership)
class MembershipAdmin(admin.ModelAdmin):
    list_display = ("id", "person", "team", "role", "created_at")
    search_fields = ("person__name", "team__name")
    list_filter = ("role", "team")

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("id", "team", "name", "lat", "lon", "created_at")
    search_fields = ("name", "team__name")
    list_filter = ("team",)
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at")


@admin.register(Training)
class TrainingAdmin(admin.ModelAdmin):
    list_display = ("id", "team", "location", "start_at", "created_at")
    search_fields = ("team__name", "location__name")
    list_filter = ("team", "location", "start_at")
    ordering = ("-start_at",)
    readonly_fields = ("created_at", "updated_at")

@admin.register(Lineup)
class LineupAdmin(admin.ModelAdmin):
    list_display = ("id", "training", "state", "created_at", "updated_at")
    search_fields = ("training__team__name",)
    list_filter = ("state", "training__team")

@admin.register(LineupSeat)
class LineupSeatAdmin(admin.ModelAdmin):
    list_display = ("id", "lineup", "side", "seat_number", "person", "created_at")
    search_fields = ("person__name", "lineup__training__team__name")
    list_filter = ("side", "lineup__training__team")
