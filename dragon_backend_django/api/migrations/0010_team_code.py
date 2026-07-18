import secrets
from django.db import migrations, models


ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def generate_codes(apps, schema_editor):
    Team = apps.get_model("api", "Team")
    existing = set(Team.objects.exclude(code="").values_list("code", flat=True))
    for team in Team.objects.filter(code=""):
        while True:
            candidate = "".join(secrets.choice(ALPHABET) for _ in range(6))
            if candidate not in existing:
                existing.add(candidate)
                team.code = candidate
                team.save(update_fields=["code"])
                break


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0009_person_user_alter_person_phone"),
    ]

    operations = [
        migrations.AddField(
            model_name="team",
            name="code",
            field=models.CharField(max_length=8, blank=True, default=""),
            preserve_default=False,
        ),
        migrations.RunPython(generate_codes, noop),
        migrations.AlterField(
            model_name="team",
            name="code",
            field=models.CharField(max_length=8, unique=True, blank=True),
        ),
    ]