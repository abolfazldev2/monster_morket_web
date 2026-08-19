#!/bin/sh
set -e

echo "Waiting for postgres at ${POSTGRES_HOST:-postgres}:${POSTGRES_PORT:-5432}..."
while ! nc -z "${POSTGRES_HOST:-postgres}" "${POSTGRES_PORT:-5432}"; do
  sleep 0.5
done
echo "Postgres is up."

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"
