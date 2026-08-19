# MONSTER Market — Platform Architecture & UI/UX Design

A production-ready multi-game digital gaming marketplace. Modular monolith, dark premium aesthetic, Django REST + React, extensible product model, manual-but-tracked Telegram payment and Steam fulfillment flows.

---

## 1. Brand & Design System

**Name:** MONSTER Market
**Positioning:** Premium, trustworthy, fast — a serious storefront, not a fan site.

### 1.1 Color tokens

```
--bg-base:        #0A0B0D   /* near-black charcoal */
--bg-surface:      #131418   /* card background */
--bg-surface-alt:  #1B1D22   /* elevated card / hover */
--border-subtle:   #2A2D33
--text-primary:    #F2F3F5
--text-secondary:  #9AA0AA
--text-muted:      #5C616B

--accent-primary:  #E23B3B   /* monster crimson — primary CTA, active states */
--accent-primary-hover: #FF4D4D
--accent-secondary: #7B5CF0  /* violet — secondary highlights, badges */
--accent-warn:      #E2A63B
--accent-success:   #35C577
--accent-danger:    #E24B4B

--glow-primary: 0 0 24px rgba(226,59,59,0.25)
```

Glow is used **only** on: primary CTA hover, active nav item underline, and "hot deal" badges. Nowhere else — this is a restraint rule, not a style suggestion.

### 1.2 Typography

- Display/Headings: `Inter` or `Sora`, 600–700 weight
- Body: `Inter`, 400–500
- Numerics/prices: tabular-nums, 600 weight, slightly larger than body

### 1.3 Components

- Cards: `border-radius: 12px`, 1px `--border-subtle` border, no heavy shadow — depth comes from background layering (base → surface → surface-alt), not shadows.
- Primary button: solid `--accent-primary`, white text, subtle glow on hover, `border-radius: 8px`.
- Secondary button: transparent, 1px border `--border-subtle`, text `--text-primary`.
- Status pills: rounded-full, colored by state (see §9, §11 status colors below).
- Skeleton loaders for all async content — never a blank white flash on a dark theme.

---

## 2. System Architecture

```
┌─────────────┐      HTTPS/JSON       ┌──────────────────┐      SQL       ┌────────────┐
│   React SPA  │ ───────────────────▶ │  Django REST API  │ ─────────────▶ │ PostgreSQL │
│  (i18next)   │ ◀─────────────────── │  (modular monolith)│ ◀───────────── │            │
└─────────────┘                       └─────────┬─────────┘                └────────────┘
                                                  │
                                     ┌────────────┼────────────┐
                                     ▼                         ▼
                               ┌──────────┐              ┌──────────┐
                               │  Redis    │              │  Celery   │
                               │ (cache,   │◀────────────▶│ (workers) │
                               │  broker)  │              └──────────┘
                               └──────────┘
```

- **Modular monolith**: one Django project, isolated apps (`users`, `games`, `products`, `cart`, `orders`, `payments`, `fulfillment`, `wishlist`, `reviews`, `coupons`, `notifications`), each with its own models/serializers/views/urls. No cross-app model imports outside of well-defined service interfaces — this is what keeps future service extraction possible without a rewrite.
- Nginx terminates TLS and reverse-proxies `/api/` → Django, everything else → static React build (or serves it directly).
- Celery handles: notification dispatch, cart expiry cleanup, scheduled reports, future automation.

---

## 3. Product Data Model (generic, game-agnostic)

The core rule: **no `DotaProduct` / `CS2Product` tables.** Everything is `Product` + relations.

```
Game
  id, name, slug, icon, banner_image, is_active, sort_order

Category
  id, game (FK), name, slug, sort_order

Product
  id, game (FK), category (FK)
  name, slug, description
  product_type            # e.g. "item", "subscription", "game_time"
  base_price, currency
  stock                    # null = unlimited/digital
  is_active
  delivery_method (FK → DeliveryMethod)
  cover_image
  created_at, updated_at

ProductVariant
  id, product (FK)
  name                     # "30 Days", "3 Months", "Factory New"
  price_override
  stock
  sort_order

ProductTranslation
  id, product (FK), language_code  [en|fa|ar|ru]
  name, description
  unique_together(product, language_code)

ProductRequiredField
  id, product (FK)
  field_key                # "steam_profile_url", "battlenet_account", "region", "faceit_username"
  label
  field_type                # text | url | select
  is_required
  validation_regex (nullable)
  options (JSON, for select type)
  sort_order
```

**Why this matters:** adding "Valorant Points" later is a data operation — insert a `Game`, a `Category`, `Product` rows, and the right `ProductRequiredField` rows. Zero schema changes, zero new tables, zero frontend redeploys (the checkout form is rendered dynamically from `ProductRequiredField`).

### 3.1 Dynamic checkout field rendering (frontend contract)

`GET /api/products/{id}/` returns:

```json
{
  "id": 118,
  "name": "Pudge Arcana",
  "game": "dota2",
  "price": "18.40",
  "delivery_method": "STEAM_GIFT",
  "required_fields": [
    {
      "field_key": "steam_profile_url",
      "label": "Steam Profile URL or SteamID64",
      "field_type": "text",
      "is_required": true,
      "validation_regex": "^(https://steamcommunity\\.com/(id|profiles)/[\\w-]+/?|\\d{17})$"
    }
  ]
}
```

The React checkout form is a **generic field renderer** — one component that maps `field_type` → input component. No product-specific checkout components ever get written.

---

## 4. Order & Fulfillment Model

```
Order
  id, order_number (human-readable, e.g. "MM-10482")
  user (FK)
  status            # see §4.1
  subtotal, discount_amount, total, currency
  coupon (FK, nullable)
  admin_notes[]     # via AdminNote model, not inline text
  created_at, updated_at

OrderItem
  id, order (FK), product (FK), variant (FK, nullable)
  quantity, unit_price, subtotal
  customer_data (JSON)    # answers to ProductRequiredField, snapshotted at purchase time

Payment
  id, order (FK, one-to-one or one-to-many for partial/retries)
  method             # "telegram" (only method in v1, but a field not a hardcode)
  status             # see §4.2
  amount, currency
  telegram_contact_reference
  confirmed_by (FK → User, admin), confirmed_at

Fulfillment
  id, order_item (FK)
  delivery_method    # STEAM_GIFT | STEAM_TRADE | GAME_CODE | MANUAL_ACTIVATION
  status             # see §4.3
  assigned_admin (FK → User, nullable)
  internal_notes[]   # FulfillmentNote, timestamped, per-admin
  steam_profile_url, steam_id64   # only public identifiers, ever
  delivery_data (JSON)            # e.g. game code, once issued
  friend_requested_at, trade_ready_at, delivered_at, completed_at

AuditLog
  id, user (FK, admin), action, target_model, target_id
  old_value (JSON), new_value (JSON), ip_address, created_at
```

Note the explicit separation: **Order status**, **Payment status**, and **Fulfillment status** are three independent state machines that reference each other but never overload one field for three concerns. This is what lets "payment received, fulfillment blocked by Steam trade cooldown" exist as a valid, representable state.

### 4.1 Order status
`PENDING → WAITING_FOR_PAYMENT → PAID → PROCESSING → COMPLETED`
side branches: `→ CANCELLED`, `→ REFUNDED` (from most states except COMPLETED)

### 4.2 Payment status
`PENDING → WAITING_FOR_PAYMENT → PAYMENT_RECEIVED`
side branches: `→ FAILED`, `→ REFUNDED`, `→ CANCELLED`

### 4.3 Fulfillment status (Steam-specific superset)
`PENDING → WAITING_FOR_PAYMENT → PAID → PROCESSING → STEAM_FRIEND_REQUESTED → WAITING_TRADE → DELIVERED → COMPLETED`
side branch: `→ CANCELLED`, `→ REFUNDED`

Non-Steam delivery methods (`GAME_CODE`, `MANUAL_ACTIVATION`) use a reduced subset: `PENDING → PROCESSING → DELIVERED → COMPLETED`.

---

## 5. Core User Flows

### 5.1 Purchase flow (Steam item, e.g. Dota 2 Arcana)

```
Browse → Product page → Add to Cart / Buy Now
   → Cart review
   → Checkout: dynamic required fields (Steam Profile URL) rendered from ProductRequiredField
   → Order created → status PENDING → WAITING_FOR_PAYMENT
   → Order confirmation page:
        "Order #MM-10482 · Total $18.40 · Contact us on Telegram, mention this order ID"
   → Customer messages Telegram with order number
   → [Admin side] Admin confirms payment manually in dashboard
        Payment: PAYMENT_RECEIVED · Order: PAID → PROCESSING
   → Fulfillment queue picks up order
        Admin sends Steam friend request → STEAM_FRIEND_REQUESTED
        Steam trade cooldown / friend accepted → WAITING_TRADE
        Trade sent and completed → DELIVERED
        Admin marks COMPLETED
   → Customer sees live status on Order Details page throughout
   → Notification fired at each transition (order created, payment confirmed, processing, completed)
```

### 5.2 Non-Steam flow (WoW Game Time / FACEIT)

Same order/payment path; fulfillment collapses to `PROCESSING → DELIVERED → COMPLETED` since delivery is a code or manual account activation, not a Steam trade — no friend-request/trade-cooldown states apply.

---

## 6. Frontend Architecture (React)

```
frontend/src/
  components/
    layout/        Navbar, Footer, MobileNav
    product/        ProductCard, ProductGrid, PriceDisplay, VariantSelector
    cart/           CartItem, CartSummary
    checkout/       DynamicFieldRenderer, RequiredFieldInput, OrderSummaryCard
    orders/         OrderStatusTimeline, OrderCard
    common/         Button, Input, Select, Modal, Skeleton, Badge, EmptyState
  pages/
    Home, Shop, GamePage, CategoryPage, ProductDetails, SearchResults,
    Offers, BestSellers, Login, Register, ForgotPassword,
    account/ Dashboard, Profile, Orders, OrderDetails, Cart, Checkout,
              Wishlist, Notifications, Settings,
    admin/    Dashboard, Orders, OrderDetails, Payments, Fulfillment,
              Products, ProductForm, Games, Categories, Users, UserDetails,
              Coupons, Reviews, Notifications, Reports, AuditLogs, Settings
  services/api/      axios instance, resource modules (products.ts, orders.ts, ...)
  hooks/             useCart, useAuth, useProduct, useOrders
  context/           AuthContext, CartContext, LocaleContext
  i18n/              locales/{en,fa,ar,ru}/translation.json
  layouts/           PublicLayout, AccountLayout, AdminLayout
  utils/             steamId.ts (client-side pre-validation), currency.ts
```

- **State/data:** TanStack Query for server state (products, orders), React Context only for auth/cart/locale (small, cross-cutting UI state).
- **RTL:** `dir` attribute driven off `LocaleContext`; Tailwind config uses logical properties (`ms-`, `me-`, `ps-`, `pe-`) instead of `ml-`/`mr-` throughout, so flipping `fa`/`ar` requires no per-component changes.
- **Route guards:** `PublicLayout` (no auth), `AccountLayout` (auth required, role=CUSTOMER+), `AdminLayout` (role in SUPPORT/FULFILLMENT_ADMIN/SUPER_ADMIN, further gated per-page by permission).

---

## 7. Backend Architecture (Django)

```
backend/
  config/                settings/{base,dev,prod}.py, urls.py, celery.py
  apps/
    users/                custom User model, roles, auth (JWT or session+CSRF)
    games/                Game, Category
    products/             Product, ProductVariant, ProductTranslation, ProductRequiredField
    cart/                 Cart, CartItem (+ guest cart via session key merge-on-login)
    orders/                Order, OrderItem
    payments/              Payment, Telegram reference logic
    fulfillment/            Fulfillment, FulfillmentNote, delivery method strategies
    wishlist/               Wishlist, WishlistItem
    reviews/                 Review
    coupons/                 Coupon, Discount
    notifications/           Notification, dispatch via Celery
  common/                  AuditLog, permissions.py, pagination.py, validators.py
  manage.py
```

- Each app exposes a thin `services.py` for cross-app operations (e.g. `orders.services.create_order_from_cart(cart, user)`) rather than views reaching into other apps' models directly.
- **Delivery method as strategy pattern:** `fulfillment/delivery_methods/` holds `steam_gift.py`, `steam_trade.py`, `game_code.py`, `manual_activation.py`, each implementing the same interface (`get_status_flow()`, `get_admin_actions()`). Adding a delivery method = adding one file + a DB row, not branching logic scattered across views.

---

## 8. API Surface (representative)

```
GET    /api/games/
GET    /api/games/{slug}/
GET    /api/categories/?game=dota2
GET    /api/products/?game=dota2&category=items&sort=price_asc&page=2
GET    /api/products/{slug}/
GET    /api/products/{slug}/required-fields/

POST   /api/cart/items/
PATCH  /api/cart/items/{id}/
DELETE /api/cart/items/{id}/
GET    /api/cart/

POST   /api/orders/                 # creates order from cart, snapshots customer_data
GET    /api/orders/
GET    /api/orders/{order_number}/

POST   /api/payments/{order_id}/telegram-reference/   # generates contact string
GET    /api/payments/{id}/

POST   /api/wishlist/items/
DELETE /api/wishlist/items/{id}/

GET    /api/account/
PATCH  /api/account/
GET    /api/account/stats/          # total/completed/pending orders, total spend

# Admin (role-protected, separate permission classes per endpoint)
GET    /api/admin/orders/?status=processing
POST   /api/admin/orders/{id}/confirm-payment/
POST   /api/admin/fulfillment/{id}/transition/   {"to": "STEAM_FRIEND_REQUESTED"}
POST   /api/admin/fulfillment/{id}/notes/
GET    /api/admin/reports/sales-over-time/
GET    /api/admin/audit-logs/
```

All list endpoints: cursor or page-number pagination, filterable, indexed on the filtered columns (`game_id`, `category_id`, `status`, `created_at`).

---

## 9. Internationalization

- 4 languages from day one: `en`, `fa`, `ru` (LTR/LTR... wait — `fa` is RTL), `ar`.
  - LTR: `en`, `ru`
  - RTL: `fa`, `ar`
- Frontend: `react-i18next`, namespace-per-feature JSON files, `dir` and `lang` set on `<html>` at the layout root, re-rendered (not reloaded) on language switch.
- Backend: `ProductTranslation` per `(product, language_code)`; API returns the translation matching `Accept-Language` header or `?lang=` query param, falling back to `en`.
- Currency/number formatting via `Intl.NumberFormat` per locale, decoupled from language (a Persian-speaking user can still price in USD).

---

## 10. Security

- Password hashing: Django's default (PBKDF2/Argon2), never custom.
- Auth: JWT access/refresh (short-lived access, httpOnly refresh cookie) or Django session + CSRF token — either is acceptable; **never** store tokens in `localStorage` if avoidable.
- CORS: explicit allow-list of frontend origins, no wildcard in production.
- Rate limiting: Redis-backed, applied to login, password reset, and order-creation endpoints specifically (abuse-prone).
- Object-level permissions: a customer can only fetch their own `Order`/`Cart`/`Wishlist` — enforced in queryset filtering, not just serializer hiding.
- **Explicit non-collection:** no field, model, or admin view anywhere stores Steam passwords, Steam Guard codes, or any third-party credentials — only public profile URLs / SteamID64. This is a hard architectural constraint, not a UI omission.
- Admin actions (`confirm-payment`, `transition`, `refund`, price/stock edits, user suspension) write to `AuditLog` synchronously in the same transaction as the action, so there's no window where an action succeeds but goes unlogged.
- Role-based permission classes: `CUSTOMER`, `SUPPORT` (read + notes only), `FULFILLMENT_ADMIN` (fulfillment transitions), `SUPER_ADMIN` (everything incl. refunds, user management, settings).

---

## 11. Admin Dashboard — Structure & Key Screens

### 11.1 Navigation

```
Overview | Orders | Payments | Fulfillment | Products | Games | Categories
Users | Coupons | Reviews | Notifications | Reports | Audit Logs | Settings
```

### 11.2 Overview

Stat cards: Total sales, Today's sales, Total orders, Pending orders, Pending payments, Active products, Registered users.
Charts: Sales over time (line), Orders over time (line), Top products (bar), Sales by game (donut), Pending fulfillment (bar by status).

### 11.3 Order Detail (admin view)

```
Order #MM-10482                                    [PROCESSING ●]
────────────────────────────────────────────────────────────────
Customer: Abolfazl (abolfazl@mail.com)
Product:  Pudge Arcana × 1              $18.40
Steam ID: 76561198XXXXXXXXX

Payment                                             [PAID ●]
  Method: Telegram   Confirmed by: admin1   at 2026-08-13 18:30

Fulfillment                                    [WAITING_TRADE ●]
  Assigned: admin2
  ● Payment confirmed        2026-08-13 18:30
  ● Fulfillment started      2026-08-13 18:32
  ● Friend request sent      2026-08-13 18:40
  ● Friend accepted / waiting trade cooldown

  Internal notes:
    admin2 — "Steam trade hold active, ~6h remaining"

  [Confirm Payment] [Start Fulfillment] [Friend Request Sent]
  [Friend Added] [Trade/Gift Ready] [Item Delivered] [Complete Order]
  [Cancel Order] [Refund]
```

Status pills use color coding: gray = pending, amber = waiting/processing, blue = in-progress, green = completed/delivered, red = cancelled/refunded.

---

## 12. Customer Account Dashboard

```
My Account
  Profile · Orders · Cart · Wishlist · Payments · Notifications · Settings

Stats:  Total orders · Completed · Pending · Total spend
```

**Order Details (customer view)** mirrors the admin timeline but read-only, with plain-language status labels ("We're preparing your Steam trade" instead of raw enum names) and the Telegram contact button re-shown if payment is still pending.

---

## 13. Homepage Layout

```
[Navbar: MONSTER Market | Home CS2 Dota2 WoW FACEIT Offers Best Sellers | 🔍 ♥ 🛒 👤]

Hero — "Your Gaming Marketplace" — subtext, primary CTA "Browse Products"

Featured Games (4 cards: CS2 / Dota 2 / WoW / FACEIT)

Best Sellers (product grid, 4-6 cards)

Special Offers (banner strip)

Popular Categories

Why MONSTER Market — Secure ordering / Fast fulfillment / Trusted marketplace / Multi-game

Footer — links, language selector, socials, payment/trust badges
```

---

## 14. Checkout Flow (screen-level)

```
1. Cart Review        → editable quantities, subtotal
2. Checkout           → dynamic required fields (rendered per product), order summary
3. Order Confirmation → "Order #MM-10482 created — WAITING_FOR_PAYMENT"
                         Total, [Contact MONSTER Market on Telegram] (prefilled order ref)
4. Order Details      → live status timeline, persists as source of truth
```

No step implies Telegram contact = payment. The UI copy explicitly states payment is confirmed manually by an admin after contact.

---

## 15. Responsive Strategy

- Desktop (≥1280px): full nav, multi-column grids, side-by-side cart/checkout summary.
- Tablet (768–1279px): condensed nav (icons + key labels), 2-column grids, stacked checkout summary.
- Mobile (<768px): hamburger nav, single-column grids, sticky bottom bar (Cart total + CTA) on product/checkout pages, bottom-sheet modals instead of centered dialogs.
- All breakpoints share the same component tree — layout changes via CSS grid/flex reflow, not separate mobile components, except `MobileNav`.

---

## 16. Deployment

```
docker-compose.yml
  frontend   (nginx serving React build, or Vite dev server in dev)
  backend    (gunicorn + Django)
  postgres
  redis
  celery     (worker) + celery-beat (scheduler)
  nginx      (reverse proxy, TLS termination in prod)
```

Secrets (`DB password`, `SECRET_KEY`, Telegram bot token if used for notifications, etc.) are injected via `.env` / orchestrator secrets — never committed, never hardcoded.

---

## 17. Extensibility Checklist (how future items slot in)

| New requirement | What changes |
|---|---|
| Add Valorant Points | New `Game`, `Category`, `Product` rows + `ProductRequiredField` rows. No code. |
| Add a real payment gateway | New `PaymentMethod` implementation behind the existing `Payment` model's `method` field; UI adds a payment option, checkout flow unchanged. |
| Add automated Steam delivery | New delivery-method strategy class implementing the existing interface; manual admin actions become optional rather than required. |
| Add a 5th language | New `locales/xx/` file + `ProductTranslation` rows for `xx`; add `xx` to LTR/RTL map if needed. |
| Add loyalty points | New `apps/loyalty/` app, hooks into `orders.services` on order completion — doesn't touch existing apps' internals. |

---

This document intentionally favors explicit state machines (order/payment/fulfillment kept separate) and a generic, data-driven product/checkout model over shortcuts, since those two decisions are what let MONSTER Market add games and products without redesigning the core system later.
