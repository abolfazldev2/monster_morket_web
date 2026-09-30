# MONSTER Market

A multi-game digital gaming marketplace — Django REST API + React frontend,
built on a generic Product/Game/Category model with dynamic per-product
checkout fields, an independent Order/Payment/Fulfillment state machine, and
a manual-but-tracked Telegram payment + Steam fulfillment workflow.

See `ARCHITECTURE.md` (or the design doc you already have) for the full
system design. This README covers running and deploying the code.

## What's implemented

- **Backend** (`backend/`): all apps from the architecture — `users`,
  `games`, `products`, `cart`, `orders`, `payments`, `fulfillment`,
  `wishlist`, `coupons`, `reviews`, `notifications` — with models,
  serializers, viewsets, URLs, Django admin, and an audit log wired into
  every state-changing admin action.
- **Frontend** (`frontend/`): React + Vite + Tailwind, i18n in
  en/fa/ar/ru with RTL support, and the full customer purchase flow (Home →
  Shop → Product → dynamic Checkout → Order status page with the Telegram
  contact flow), account dashboard, and a working admin fulfillment queue.
- **Infra**: Docker Compose wiring Postgres, Redis, Celery worker + beat,
  the Django backend, the built React app, and an nginx reverse proxy.

## What's intentionally left for you to extend

This is a strong, working core — not a pixel-complete implementation of
all 38 pages from the spec. Explicitly stubbed or simplified:

- Admin pages for Products/Games/Categories/Users/Coupons/Reviews/Reports/
  Audit Logs beyond what's listed above use the built-in **Django admin**
  (`/django-admin/`) rather than custom React screens — fully functional,
  just not restyled to match the storefront.
- Email delivery for password reset is not wired to a real mail provider
  (the token is generated and stored; sending the email is a one-function
  Celery task away — see the `TODO` in `apps/users/views.py`).
- Automated tests currently cover order creation, payments, fulfillment, and reviews.

## Run the project on a new machine with Docker

Prerequisites: Git, Docker Engine or Docker Desktop, and the Docker Compose plugin.
Run these commands from a terminal:

    git clone https://github.com/abolfazldev2/monster_morket_web.git
    cd monster_morket_web
    cp .env.example .env

Edit .env and set unique values for DJANGO_SECRET_KEY and POSTGRES_PASSWORD.
Keep .env private; Git ignores it. The sample already sets Telegram support to
abolfazls-s.

Build and start all services:

    docker compose up -d --build
    docker compose ps

Database migrations run automatically when the backend starts. Add demo
products and create an administrator:

    docker compose exec backend python manage.py seed_demo_data
    docker compose exec backend python manage.py createsuperuser

Public registration creates customers by default. Give the superuser access to
the React admin dashboard by replacing YOUR_USERNAME with the username you just
created:

    docker compose exec backend python manage.py shell -c "from apps.users.models import User; User.objects.filter(username='YOUR_USERNAME').update(role='SUPER_ADMIN')"

Open the storefront at http://localhost, the React admin at
http://localhost/admin, and Django admin at http://localhost/django-admin/.
The product categories are /shop/cs2, /shop/dota2, /shop/wow, and /shop/faceit.

Useful commands:

    docker compose logs -f backend
    docker compose down

docker compose down stops containers and keeps database data. To run the
backend tests:

    docker compose exec backend sh -lc 'DJANGO_SETTINGS_MODULE=config.settings.test python manage.py test apps.orders apps.payments apps.fulfillment apps.reviews'

## Run locally without Docker

The backend needs PostgreSQL and Redis. Copy the root .env.example to .env and
adjust POSTGRES_HOST and REDIS_URL for your local services, then run:

    cd backend
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
    set -a; source ../.env; set +a
    python manage.py migrate
    python manage.py seed_demo_data
    python manage.py runserver

In a second terminal, run the frontend:

    cd frontend
    npm ci
    npm run dev

The Vite dev server uses frontend/.env.example and proxies API requests to
http://localhost:8000/api.

## Production deployment

The Compose setup above is documented for local development and testing.
Before exposing this project to public traffic, configure HTTPS, review and
harden Django production settings, use real secrets and allowed hosts, and
prepare a database backup plan. Never reuse sample .env values on a public
server.

## Extending it (per the architecture doc)

- **New game/product**: no code — add rows via `/django-admin/` (or the
  seed command as a template) for `Game`, `Category`, `Product`, and any
  `ProductRequiredField`s it needs. The checkout form renders them
  automatically.
- **New delivery method**: add one file to
  `backend/apps/fulfillment/delivery_methods/` implementing
  `BaseDeliveryStrategy`, register it in `delivery_methods/base.py`'s
  registry. The admin fulfillment queue picks up its actions automatically.
- **A real payment gateway**: add a new `Payment.Method` choice and the
  gateway-specific confirmation logic in `apps/payments/services.py` —
  the Order/Fulfillment state machines don't need to change.
