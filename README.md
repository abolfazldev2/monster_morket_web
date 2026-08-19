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
- No automated tests yet.

## Running locally without Docker (fastest way to iterate)

Backend:

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # then edit DJANGO_SECRET_KEY, POSTGRES_*, etc.
export $(cat ../.env | xargs)  # or use python-decouple's .env loading directly
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo_data   # populates CS2/Dota2/WoW/FACEIT demo products
python manage.py runserver
```

You'll need a local Postgres and Redis running (or point `POSTGRES_HOST`/
`REDIS_URL` at Docker-run instances of just those two services).

Frontend:

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:8000/api
npm install
npm run dev
```

## Deploying to a VPS with Docker (production)

1. **Get a server.** Any VPS with Docker + Docker Compose installed (Ubuntu
   22.04/24.04 is a safe default). Point a domain's A record at its IP if
   you have one — not required to get started.

2. **Copy the project to the server:**

   ```bash
   git clone <your-repo-url> monster-market   # or scp the folder up
   cd monster-market
   ```

3. **Configure secrets:**

   ```bash
   cp .env.example .env
   nano .env
   ```

   At minimum set `DJANGO_SECRET_KEY` (any long random string —
   `python -c "import secrets; print(secrets.token_urlsafe(50))"` works),
   `POSTGRES_PASSWORD`, and `DJANGO_ALLOWED_HOSTS`/`CORS_ALLOWED_ORIGINS`
   to your actual domain or server IP.

4. **Build and start everything:**

   ```bash
   docker compose up -d --build
   ```

   This starts Postgres, Redis, the Django backend (migrations run
   automatically on container start via `entrypoint.sh`), Celery worker +
   beat, the built React app, and nginx on port 80.

5. **Create an admin user and seed demo products:**

   ```bash
   docker compose exec backend python manage.py createsuperuser
   docker compose exec backend python manage.py seed_demo_data
   ```

6. **Visit the site** at `http://<your-server-ip>/` — the storefront is
   live, `/django-admin/` has the full Django admin, and the React admin
   dashboard is at `/admin` once you log in with an account whose `role`
   is set to `SUPER_ADMIN`, `FULFILLMENT_ADMIN`, or `SUPPORT` (set this in
   `/django-admin/users/user/` for now).

7. **Put HTTPS in front of it** (recommended before real traffic): the
   simplest path is adding [Caddy](https://caddyserver.com/) or
   [nginx-proxy + acme-companion](https://github.com/nginx-proxy/acme-companion)
   in front of the `nginx` service, or terminating TLS with a managed load
   balancer if your VPS provider offers one. `config/settings/prod.py`
   already assumes HTTPS is in place (`SECURE_SSL_REDIRECT = True`, secure
   cookies) — set those to `False` temporarily if you're testing without
   TLS first.

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
