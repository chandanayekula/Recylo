# WasteLoop Backend — Intelligent Waste Collection & Circular Economy Engine

Senior architectural implementation of the **WasteLoop** backend built with **Python 3**, **Flask**, **Flask-SQLAlchemy**, and **MySQL 8.0.x**.

---

## 🏛️ Layered Architecture

```
backend/
├── app.py                     # Flask application factory, CORS & error handlers
├── config.py                  # Environment settings & MySQL connection string
├── extensions.py              # Shared SQLAlchemy database instance
├── seed.py                    # Complete demo state population script
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variables template
├── .env                       # Local environment credentials
├── models/                    # Relational data entities
│   ├── user.py                # Admin, Collector, Generator actors
│   ├── waste_source.py        # Facilities, GPS coordinates, purity rates
│   ├── collector.py           # Collector profiles, ratings, active workload
│   ├── availability.py        # Flexible shift slots & duty status
│   ├── vehicle.py             # Collection vehicles (EV trucks, vans, trikes)
│   ├── pickup.py              # Pickup order lifecycle & state machine
│   ├── smart_bin.py           # Ultrasonic IoT sensors, fill rate, overflow trend
│   ├── recovery.py            # Material reclamation, recycling & diversion
│   ├── journey.py             # Chain-of-custody immutable milestone audit trail
│   └── earning.py             # Collector payouts, base, distance & weight bonuses
├── services/                  # Business logic services
│   ├── auth_service.py        # Session management & credential verification
│   ├── priority_service.py    # Explainable AI rule-based priority engine (40/25/20/15 formula)
│   ├── overflow_service.py    # Time-to-overflow predictor & bin-to-pickup generator
│   ├── collector_matching_service.py # Multi-factor ranking (workload, shifts, vehicle capacity)
│   ├── route_service.py       # Haversine nearest-neighbor route sequencer
│   ├── recovery_service.py    # Safe division-by-zero recovery rate calculations
│   ├── earnings_service.py    # Estimated WasteLoop Earnings formula ($30 base + bonuses)
│   ├── circularity_service.py # Internal WasteLoop Circularity Score (0-100)
│   └── insight_service.py     # Live data-driven operational intelligence statements
├── routes/                    # Modular Blueprints
│   ├── auth_routes.py         # /api/login, /api/logout, /api/me
│   ├── dashboard_routes.py    # /api/dashboard, /api/ai/insights
│   ├── source_routes.py       # /api/sources
│   ├── pickup_routes.py       # /api/pickups (CRUD, assign, status, journey)
│   ├── collector_routes.py    # /api/collectors (available, shifts, accept-job, earnings)
│   ├── vehicle_routes.py      # /api/vehicles
│   ├── bin_routes.py          # /api/bins, /api/bins/<id>/create-pickup
│   ├── recovery_routes.py     # /api/recovery
│   ├── map_routes.py          # /api/map, /api/route
│   └── journey_routes.py      # /api/journey
└── utils/                     # Shared utilities
    ├── validators.py          # Strict state transitions & quantity constraint validators
    ├── permissions.py         # @login_required, @roles_required decorators
    ├── responses.py           # Standardized JSON response formatting
    └── distance.py            # Haversine spherical distance formula
```

---

## 🚀 Quick Setup Guide

### 1. Database Configuration (PostgreSQL)
Ensure your PostgreSQL instance is running. The database `wasteloop` will be automatically created by `seed.py` if your user has permission, or you can create it via `psql` / pgAdmin:
```sql
CREATE DATABASE wasteloop;
```

### 2. Environment Configuration
Check `.env` in the `backend/` directory:
```ini
# Database Configuration (PostgreSQL)
DB_TYPE=postgresql
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=your_postgres_password
PG_DATABASE=wasteloop

# Or set direct connection string (e.g., Supabase, Neon, Render, Railway, local):
# DATABASE_URL=postgresql+psycopg2://postgres:your_password@localhost:5432/wasteloop

# Flask Application Settings
SECRET_KEY=wasteloop_secure_secret_2026
FLASK_ENV=development
PORT=5000
```
*(Note: MySQL 8.0 is also supported by setting `DB_TYPE=mysql` and providing `MYSQL_*` credentials).*

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Seed Demo Data
Run the seeding script to initialize tables and populate sample entities:
```bash
python seed.py
```

### 5. Start Backend Server
```bash
python app.py
```
The server will start listening at `http://localhost:5000`.

---

## 🔑 Demo Accounts & Pre-Loaded Conditions

| Role | Email | Password | Notes |
|---|---|---|---|
| **Admin** | `admin@wasteloop.com` | `admin123` | Full operations & dispatch visibility |
| **Collector** | `ravi@wasteloop.com` | `collector123` | **Ravi Kumar**, assigned to **TRUCK-03**, active shifts |
| **Generator** | `user@wasteloop.com` | `user123` | Waste partner managing sources & pickup requests |

### Critical Demo Conditions Enforced:
- **Bin `BIN-001`** is at **92.0% capacity** with an overflow prediction of approximately **2.0 hours** (`fill_rate = 4.0%/hr`).
- Collector **Ravi Kumar** is pre-configured with vehicle `TRUCK-03`, part-time daily shift availability, and completed job history.
- Priority engine dynamically calculates HIGH priority for critical Smart Bin alerts.
- Live dashboard metrics, circularity score (88%), and AI insights compute dynamically from MySQL queries.

---

## 📡 API Contract

All endpoints return a uniform JSON format:

### Success (200, 201)
```json
{
  "success": true,
  "message": "Human-readable message",
  "data": {}
}
```

### Error (400, 401, 403, 404, 409, 422, 500)
```json
{
  "success": false,
  "message": "Human-readable error description",
  "error": "ERROR_CODE"
}
```

---

## 🔐 Authentication Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/register` | Public | Create a new user account |
| `POST` | `/api/login` | Public | Authenticate and open session |
| `POST` | `/api/logout` | Session | Close current session |
| `GET` | `/api/me` | Session | Retrieve current user profile |

### `POST /api/register`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepass",
  "role": "GENERATOR",
  "phone": "+1 (555) 0199"
}
```
> `role` must be one of: `ADMIN`, `COLLECTOR`, `GENERATOR`

### `POST /api/login`
```json
{ "email": "admin@wasteloop.com", "password": "admin123" }
```
Returns the full user profile with `role` and session cookie.

---

## 📊 Dashboard & Intelligence Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Full operational metrics snapshot |
| `GET` | `/api/ai/insights` | Live AI-style insight statements |

### `GET /api/dashboard` — Response shape
```json
{
  "metrics": {
    "total_collected_kg": 84.5,
    "total_recovered_kg": 75.2,
    "active_pickups": 3,
    "high_priority_count": 1,
    "circularity_score": 88.4,
    "circularity_tier": "High Performer",
    "co2_avoided_kg": 101.5,
    "trees_equivalent": 4,
    "total_earnings_usd": 42.00
  },
  "rates": { "recovery_rate": 89.0, "recycling_rate": 92.3, "diversion_rate": 91.2 },
  "weekly_trend": { "labels": ["Mon",...], "collected": [...], "diverted": [...] },
  "composition": { "labels": ["Plastics",...], "data": [...], "colors": [...] },
  "status_breakdown": { "created": 2, "assigned": 1, "completed": 1 },
  "ai_insights": [...]
}
```
All values are computed live from database aggregates — no hardcoded metrics.

---

## 🗂️ Pickup Request Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/pickups` | List pickups (role-scoped) |
| `POST` | `/api/pickups` | Create a new pickup request |
| `GET` | `/api/pickups/<id>` | Retrieve pickup detail by ID or code |
| `POST` | `/api/pickups/<id>/assign` | Dispatch a collector & vehicle |
| `POST` | `/api/pickups/<id>/status` | Advance pickup through lifecycle |
| `GET` | `/api/pickups/<id>/journey` | Full chain-of-custody trail |

### Query Parameters — `GET /api/pickups`
| Param | Values | Notes |
|---|---|---|
| `status` | `CREATED`, `ASSIGNED`, `ON_THE_WAY`, `COLLECTED`, `available` | Filter by lifecycle stage; `available` shows unassigned CREATED orders |
| `priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` | Filter by priority tier |
| `collector_id` | integer | Filter by assigned collector |

> **Role Scoping**: GENERATOR users only see pickups linked to their own waste sources. COLLECTOR users see their assigned jobs plus all CREATED (open) orders.

### `POST /api/pickups` — Request Body
```json
{
  "source_id": 1,
  "waste_type": "Plastics",
  "estimated_weight_kg": 240.0,
  "scheduled_time": "02:00 PM Today",
  "notes": "Warehouse overflow from loading bay"
}
```

### `POST /api/pickups/<id>/assign` — Request Body
```json
{
  "collector_id": 1,
  "vehicle_id": 2
}
```
> `collector_name` can be used instead of `collector_id`. Vehicle capacity is enforced — returns `409 CAPACITY_EXCEEDED` if load exceeds remaining capacity.

### `POST /api/pickups/<id>/status` — Request Body
```json
{
  "status": "COLLECTED",
  "actual_weight_kg": 235.5,
  "recyclable_quantity": 180.0,
  "recovered_quantity": 160.0,
  "disposed_quantity": 55.5,
  "notes": "Collected at loading bay. Weight verified."
}
```
Transitioning to `COLLECTED` automatically:
- Creates or updates a `material_recovery_records` entry
- Calculates and persists collector earnings
- Increments `total_completed` and decrements `current_workload` on the collector
- Appends an immutable `journey_events` milestone

---

## ♻️ Pickup Lifecycle State Machine

```
CREATED → ASSIGNED → ON_THE_WAY → COLLECTED → SEGREGATED → RECOVERED → RECYCLED
                                                                       ↘ DISPOSED
Any state → CANCELLED
```

> Illegal transitions are rejected with `409 INVALID_TRANSITION`. The validator in [`utils/validators.py`](./utils/validators.py) enforces the full allowed-transition adjacency matrix.

---

## 🚛 Collector Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/collectors` | All active collectors with duty status & vehicle |
| `GET` | `/api/collectors/available` | Only AVAILABLE collectors |
| `GET` | `/api/collectors/<id>` | Collector detail profile |
| `POST` | `/api/collectors/<id>/availability` | Set duty status or register a shift slot |
| `POST` | `/api/collectors/<id>/accept-job` | Self-dispatch a CREATED pickup (concurrency-safe) |
| `GET` | `/api/collectors/<id>/earnings` | Earnings history and total |

### `POST /api/collectors/<id>/availability` — Duty Toggle
```json
{ "status": "OFFLINE" }
```

### `POST /api/collectors/<id>/availability` — Shift Registration
```json
{
  "date": "2026-09-12",
  "start_time": "08:00",
  "end_time": "16:00",
  "status": "AVAILABLE"
}
```
Overlapping shift slots return `409 SLOT_CONFLICT`.

### `POST /api/collectors/<id>/accept-job`
```json
{ "pickup_id": "PK-1008" }
```
Uses `SELECT FOR UPDATE` to prevent race conditions when multiple collectors attempt to claim the same job simultaneously.

---

## 🗑️ Smart Bin Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/bins` | All bins, ordered by fill % descending |
| `GET` | `/api/bins/<id>` | Bin detail by ID or bin code |
| `PUT` | `/api/bins/<id>` | Update telemetry (fill %, fill rate, location) |
| `POST` | `/api/bins/<id>/create-pickup` | Trigger an automated overflow pickup |

### IoT Overflow Flow
1. Sensor telemetry updates `current_fill_pct` and `fill_rate_per_hour` via `PUT /api/bins/<id>`
2. Dashboard detects bins where `(100 - fill_pct) / fill_rate_per_hour < 6 hours`
3. `POST /api/bins/<id>/create-pickup` calls `overflow_service.create_pickup_from_bin()` which:
   - Calculates time-to-overflow
   - Runs the priority engine (`priority_service.calculate_priority_score`) with fill data
   - Creates a `CREATED` pickup with `CRITICAL` or `HIGH` priority
   - Appends the initial `CREATED` journey event

---

## 🗺️ Map & Route Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/map` | All pickup locations with GPS coordinates |
| `GET` | `/api/route` | Optimized nearest-neighbor route for active pickups |

### `GET /api/route` — Response Shape
```json
{
  "depot": { "latitude": 37.7749, "longitude": -122.4194, "name": "EcoLoop Central Operations Depot" },
  "ordered_stops": [
    { "stop_sequence": 1, "segment_distance_km": 1.2, "pickup_code": "PK-1002", ... }
  ],
  "total_distance_km": 8.45,
  "stop_count": 3,
  "high_priority_count": 1
}
```
The route optimizer (`route_service.py`) applies a **greedy nearest-neighbor heuristic** with priority-first ordering — HIGH priority stops are always sequenced before MEDIUM/LOW, then proximity is used within each group.

---

## 📦 Recovery & Journey Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/recovery` | All material recovery records |
| `GET` | `/api/journey` | All journey events, most recent first |

---

## ⚙️ Service Layer Reference

| Service | File | Responsibility |
|---|---|---|
| **Priority Engine** | `priority_service.py` | Explainable rule-based score (fill 40% + qty 25% + wait 20% + risk 15%) |
| **Overflow Predictor** | `overflow_service.py` | Time-to-overflow estimation, auto-pickup dispatch from smart bins |
| **Collector Matching** | `collector_matching_service.py` | Multi-factor ranking: availability (30 pts), capacity (20 pts), workload (20 pts), proximity (15 pts), shift (15 pts) |
| **Route Optimizer** | `route_service.py` | Nearest-neighbor Haversine sequencer, HIGH priority first |
| **Recovery Calculator** | `recovery_service.py` | Safe division-by-zero recovery, recycling & diversion rate formulae |
| **Earnings Calculator** | `earnings_service.py` | `$30 base + distance bonus + priority bonus + weight bonus` |
| **Circularity Score** | `circularity_service.py` | Weighted internal WasteLoop score (0–100) from recovery, recycling & diversion rates |
| **Insight Generator** | `insight_service.py` | Live data-driven operational intelligence statements (no LLM) |
| **Auth Service** | `auth_service.py` | Werkzeug `pbkdf2:sha256` password hashing, Flask session management |

### Priority Score Formula
```
score = (fill_pct × 0.40) + (weight_kg/500 × 0.25 × 100) + (wait_hours/24 × 0.20 × 100) + (risk_raw × 0.15)
```
| Score | Priority |
|---|---|
| ≥ 70 or fill_pct ≥ 90 | HIGH |
| 40 – 69 | MEDIUM |
| 0 – 39 | LOW |

Organic/food waste receives a **+5 urgency bonus** for perishability.

### Earnings Formula
```
total = $30 base + ($0.50/km × distance) + priority_bonus + ($0.10/kg × weight)
```

---

## 🗄️ Database Schema Overview

| Table | Rows (demo) | Key Columns |
|---|---|---|
| `users` | 4 | `email`, `role`, `password_hash` |
| `collectors` | 2 | `user_id`, `duty_status`, `rating`, `current_workload` |
| `vehicles` | 4 | `vehicle_number`, `capacity_kg`, `status`, `battery_fuel` |
| `waste_sources` | 4 | `category`, `latitude`, `longitude`, `segregation_score` |
| `smart_bins` | 6 | `bin_code`, `current_fill_pct`, `fill_rate_per_hour` |
| `pickup_requests` | 5 | `pickup_code`, `status`, `priority`, `priority_score` |
| `collector_availability` | — | `day_date`, `start_time`, `end_time`, shift overlap guard |
| `collector_earnings` | 1 | `base_payout`, `distance_bonus`, `purity_bonus`, `total_amount` |
| `material_recovery_records` | 1 | `recovery_rate`, `recycling_rate`, `diversion_rate` |
| `journey_events` | 9 | `stage`, `timestamp`, `location`, immutable append-only |

Full DDL with indexes and seed data: [`schema.sql`](./schema.sql)

---

## 🛡️ Utility Layer

| Utility | File | Notes |
|---|---|---|
| **Validators** | `utils/validators.py` | State transition adjacency matrix, quantity constraint checks |
| **Permissions** | `utils/permissions.py` | `@login_required`, `@roles_required` decorators; `get_current_user_id()` helper |
| **Responses** | `utils/responses.py` | `success_response(data, message, status_code)` / `error_response(message, error, status_code)` |
| **Distance** | `utils/distance.py` | Haversine spherical distance formula (km) |

---

## 🌐 CORS & Deployment Notes

- CORS is configured in `app.py` to allow `http://localhost:5173` (Vite dev server) and `http://localhost:3000` by default. Update `CORS_ORIGINS` in `.env` for production.
- The application is stateless-friendly — session is stored server-side via Flask's signed cookie. For horizontal scaling, replace with Redis-backed sessions.
- All timestamps are stored as `TIMESTAMP WITH TIME ZONE` in UTC. The frontend must handle timezone display.
- Sequence resets in `schema.sql` prevent primary key collisions when re-seeding on an existing database.

---

## 📋 Error Code Reference

| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | Missing or invalid field values (422) |
| `INVALID_CREDENTIALS` | Wrong email or password (401) |
| `UNAUTHORIZED` | Session required but missing (401) |
| `NOT_FOUND` | Resource does not exist (404) |
| `RESOURCE_UNAVAILABLE` | No collectors/vehicles available (409) |
| `CAPACITY_EXCEEDED` | Vehicle cannot carry the pickup weight (409) |
| `INVALID_TRANSITION` | Illegal pickup status change (409) |
| `SLOT_CONFLICT` | Overlapping collector shift slot (409) |
| `JOB_ALREADY_ASSIGNED` | Pickup claimed by another collector (409) |
| `TRANSACTION_FAILED` | Database commit error (500) |
| `BIN_DISPATCH_FAILED` | Smart bin not found for overflow dispatch (404) |
| `REGISTRATION_ERROR` | Duplicate email or constraint violation (409) |
