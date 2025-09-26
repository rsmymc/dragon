#!/bin/bash

set -e

echo "Starting Django setup..."

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Loading initial data fixtures..."
if [ -f "/app/api/fixtures/initial_data.json" ]; then
    python manage.py loaddata initial_data.json
    echo "Initial data loaded"
else
    echo "No fixture file found"
fi

echo "Creating default superuser..."
python manage.py shell << EOF
from django.contrib.auth.models import User
if not User.objects.filter(username='test_user').exists():
    User.objects.create_superuser('test_user', 'test_user@example.com', 'test_user1234')
    print('Superuser created: test_user/test_user1234')
else:
    print('Superuser already exists')
EOF

echo "Starting Django development server..."
python manage.py runserver 0.0.0.0:8000