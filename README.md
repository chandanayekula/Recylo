# ♻️ Recylo (WasteLoop)

> **Intelligent IoT Waste Management, AI-Driven Dispatch & Circular Economy Platform**

Recylo is an end-to-end smart waste collection and circularity lifecycle platform. It integrates real-time IoT smart bin telemetry, explainable multi-factor dispatch heuristics, dynamic route optimization, and an immutable chain-of-custody audit trail to maximize material recovery, streamline collector operations, and reduce carbon emissions.

---

## 🌟 Key Features

### 📡 1. IoT Smart Bin Monitoring & Overflow Prediction
- Real-time ultrasonic fill percentage and rate-of-fill (`%/hr`) tracking.
- Predictive **time-to-overflow** calculations triggering automated high-priority pickup dispatches before bins reach capacity.

### 🧠 2. Explainable Multi-Factor Priority Engine
- Transparent priority scoring based on a calibrated formula:
  $$\text{Score} = (\text{Fill}_{\%} \times 0.40) + \left(\frac{\text{Weight}_{\text{kg}}}{500} \times 0.25 \times 100\right) + \left(\frac{\text{Wait}_{\text{hours}}}{24} \times 0.20 \times 100\right) + (\text{Risk}_{\text{raw}} \times 0.15)$$
- Dynamic urgency multipliers for perishable and hazardous waste.

### 🚚 3. Smart Collector Matching & Route Optimization
- Multi-factor collector assignment ranking by duty status, vehicle capacity limits, proximity, and current workload.
- Priority-first **Greedy Nearest-Neighbor (Haversine)** route sequencing to minimize transit time and fuel consumption.

### 📊 4. Circular Economy & Sustainability Tracking
- Real-time computation of **Material Recovery Rate**, **Recycling Rate**, **Landfill Diversion Rate**, and overall **Circularity Index (0–100)**.
- Automated calculation of ecological impact metrics: **CO₂ avoided (kg)** and **equivalent trees planted**.

### 📜 5. End-to-End Chain of Custody (Journey Tracking)
- Full lifecycle status management:
  $$\text{CREATED} \longrightarrow \text{ASSIGNED} \longrightarrow \text{ON\_THE\_WAY} \longrightarrow \text{COLLECTED} \longrightarrow \text{SEGREGATED} \longrightarrow \text{RECOVERED} \longrightarrow \text{RECYCLED / DISPOSED}$$
- Timestamped, geolocation-verified milestone event log for complete transparency.

### 💰 6. Collector Earnings & Availability Management
- Transparent earnings breakdown: Base payout + distance bonus + weight bonus + priority incentives.
- Shift scheduling with automated overlap detection and concurrency-safe job acceptance (`SELECT FOR UPDATE`).

---

## 🏗️ Architecture & Tech Stack

```
waste-loop / Recylo
├── backend/                  # Flask REST API & Core Intelligence Engine
│   ├── models/               # SQLAlchemy ORM Data Models
│   ├── routes/               # Modular Flask Blueprints
│   ├── services/             # Algorithmic Services (Routing, Priority, Circularity)
│   ├── utils/                # Validators, Security, Distance Formulae
│   ├── app.py                # App Factory & CORS configuration
│   ├── seed.py               # Database Seeding Script
│   └── schema.sql            # Relational Database Schema
│
├── frontend/                 # React SPA Dashboard
│   ├── src/
│   │   ├── api/              # Axios API Client
│   │   ├── components/       # Reusable UI (Sidebar, Topbar, MetricCard, Modal, Toast)
│   │   └── views/            # Dashboard, Map, Pickups, Bins, Recovery, Collectors
│   └── index.html            # Vite HTML Entry Point
│
└── run.bat                   # Single-click launcher for Windows
```

### Technology Highlights
- **Frontend**: React 18, Vite, Chart.js & React-Chartjs-2, Leaflet Maps, Lucide Icons, Modern Glassmorphism Vanilla CSS.
- **Backend**: Python 3.10+, Flask, Flask-SQLAlchemy, Werkzeug Security, Flask-CORS.
- **Database**: PostgreSQL / MySQL 8.0 relational database with transactional integrity.

---

## 🚀 Getting Started

### Prerequisites
- **Python 3.10+** & `pip`
- **Node.js 18+** & `npm`
- **PostgreSQL** (or **MySQL 8.0+**)

---

### 1. Clone the Repository
```bash
git clone https://github.com/chandanayekula/Recylo.git
cd Recylo
```

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS / Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables in `backend/.env` (refer to `.env.example`):
   ```ini
   DB_TYPE=postgresql
   PG_HOST=localhost
   PG_PORT=5432
   PG_USER=postgres
   PG_PASSWORD=your_password
   PG_DATABASE=wasteloop
   SECRET_KEY=your_secret_key
   PORT=5000
   ```
5. Seed database with initial demo data:
   ```bash
   python seed.py
   ```
6. Start the Flask backend:
   ```bash
   python app.py
   ```
   Backend API runs at: `http://localhost:5000`

---

### 3. Frontend Setup

1. Open a new terminal and navigate to `frontend`:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Frontend Application runs at: `http://localhost:5173`

---

### ⚡ Quick Launch (Windows)
You can launch both the backend and frontend simultaneously with a single double-click on:
```cmd
run.bat
```

---

## 👥 Demo Credentials

| Role | Email | Password | Access / Capabilities |
|---|---|---|---|
| **Admin** | `admin@wasteloop.com` | `admin123` | Full control: dispatch, analytics, system management |
| **Collector** | `ravi@wasteloop.com` | `collector123` | Assigned vehicle, route views, accept jobs, record collections |
| **Generator** | `user@wasteloop.com` | `user123` | Schedule pickups, track source purity & waste journey |

---

## 📡 Core API Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/login` | Authenticate user and initiate session |
| `GET` | `/api/dashboard` | Live operational snapshot, sustainability & AI metrics |
| `GET` | `/api/pickups` | Retrieve pickup requests (with status/priority filters) |
| `POST` | `/api/pickups` | Schedule a new waste pickup |
| `POST` | `/api/pickups/<id>/status` | Advance pickup lifecycle & record recovery data |
| `GET` | `/api/bins` | IoT Smart Bins sorted by fill % & overflow alert |
| `POST` | `/api/bins/<id>/create-pickup` | Auto-dispatch pickup from smart bin overflow trigger |
| `GET` | `/api/route` | Optimized collector routing sequence |
| `GET` | `/api/journey` | Immutable chain-of-custody milestone log |
| `GET` | `/api/recovery` | Material recovery and recycling breakdown |

---

## 📄 License

This project is licensed under the **MIT License**.
