"""
WasteLoop Database Seeding Script
Populates the database with realistic demo records conforming to all hackathon specifications.
"""
from datetime import datetime, date, time, timedelta
from app import create_app
from extensions import db
from models import (
    User, WasteSource, Collector, CollectorAvailability,
    Vehicle, PickupRequest, SmartBin, RecoveryRecord,
    JourneyEvent, CollectorEarning
)

import os
from config import Config

def ensure_database_exists():
    """Ensure PostgreSQL (or MySQL) database exists before SQLAlchemy models create tables."""
    if 'postgresql' in Config.SQLALCHEMY_DATABASE_URI:
        try:
            import psycopg2
            from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
            conn = psycopg2.connect(
                host=Config.PG_HOST,
                port=int(Config.PG_PORT),
                user=Config.PG_USER,
                password=Config.PG_PASSWORD or '',
                dbname='postgres',
                connect_timeout=3
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            with conn.cursor() as cursor:
                cursor.execute(f"SELECT 1 FROM pg_database WHERE datname = '{Config.PG_DATABASE}';")
                if not cursor.fetchone():
                    cursor.execute(f'CREATE DATABASE "{Config.PG_DATABASE}";')
                    print(f"[SETUP] PostgreSQL database `{Config.PG_DATABASE}` created successfully.")
                else:
                    print(f"[SETUP] PostgreSQL database `{Config.PG_DATABASE}` already exists.")
            conn.close()
        except Exception as e:
            print(f"[NOTICE] PostgreSQL database pre-check: {e}")
    else:
        try:
            import pymysql
            conn = pymysql.connect(
                host=Config.MYSQL_HOST,
                port=int(Config.MYSQL_PORT),
                user=Config.MYSQL_USER,
                password=Config.MYSQL_PASSWORD or '',
                connect_timeout=3
            )
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DATABASE}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
            conn.commit()
            conn.close()
            print(f"[SETUP] Database `{Config.MYSQL_DATABASE}` checked/created successfully.")
        except Exception as e:
            print(f"[NOTICE] MySQL database pre-check: {e}")

def run_seed():
    try:
        ensure_database_exists()
    except Exception:
        pass

    app = create_app()
    with app.app_context():
        try:
            print("[SETUP] Creating database tables if they do not exist...")
            db.create_all()
        except Exception as err:
            target_host = Config.PG_HOST if 'postgresql' in Config.SQLALCHEMY_DATABASE_URI else Config.MYSQL_HOST
            target_port = Config.PG_PORT if 'postgresql' in Config.SQLALCHEMY_DATABASE_URI else Config.MYSQL_PORT
            print("\n" + "="*70)
            print("[DATABASE CONNECTION NOTICE]")
            print(f"Could not connect to database server at '{target_host}:{target_port}'.")
            print(f"Target URI: {Config.SQLALCHEMY_DATABASE_URI.split('@')[-1] if '@' in Config.SQLALCHEMY_DATABASE_URI else Config.SQLALCHEMY_DATABASE_URI}")
            print(f"Error detail: {err}")
            print("\nTo configure and seed your PostgreSQL database:")
            print("1. Ensure PostgreSQL is running (e.g. pgAdmin, Windows Service, or cloud instance).")
            print("2. Verify credentials in 'backend/.env':")
            print("   DB_TYPE=postgresql")
            print("   PG_HOST=localhost")
            print("   PG_PORT=5432")
            print("   PG_USER=postgres")
            print("   PG_PASSWORD=your_password")
            print("   PG_DATABASE=wasteloop")
            print("   # Or direct URL:")
            print("   # DATABASE_URL=postgresql+psycopg2://postgres:your_password@localhost:5432/wasteloop")
            print("3. Re-run: python seed.py")
            print("="*70 + "\n")
            return

        print("[SETUP] Clearing previous demo data...")
        # Clean in reverse dependency order
        CollectorEarning.query.delete()
        JourneyEvent.query.delete()
        RecoveryRecord.query.delete()
        PickupRequest.query.delete()
        CollectorAvailability.query.delete()
        SmartBin.query.delete()
        Vehicle.query.delete()
        Collector.query.delete()
        WasteSource.query.delete()
        User.query.delete()
        db.session.commit()

        # ── 1. Demo Users (Hashed Passwords) ─────────────────────
        print("[SEED] Creating Users (Admin, Collector Ravi, Generator User)...")
        admin_user = User(
            name="Operations Admin",
            email="admin@wasteloop.com",
            role="ADMIN",
            phone="+1 555-0100"
        )
        admin_user.set_password("admin123")

        ravi_user = User(
            name="Ravi Kumar",
            email="ravi@wasteloop.com",
            role="COLLECTOR",
            phone="+1 555-0101"
        )
        ravi_user.set_password("collector123")

        sarah_user = User(
            name="Sarah Chen",
            email="sarah.chen@wasteloop.com",
            role="COLLECTOR",
            phone="+1 555-0102"
        )
        sarah_user.set_password("collector123")

        marcus_user = User(
            name="Marcus Brody",
            email="marcus.b@wasteloop.com",
            role="COLLECTOR",
            phone="+1 555-0103"
        )
        marcus_user.set_password("collector123")

        elena_user = User(
            name="Elena Rostova",
            email="elena.r@wasteloop.com",
            role="COLLECTOR",
            phone="+1 555-0104"
        )
        elena_user.set_password("collector123")

        gen_user = User(
            name="Metro Generator Partner",
            email="user@wasteloop.com",
            role="GENERATOR",
            phone="+1 555-0199"
        )
        gen_user.set_password("user123")

        db.session.add_all([admin_user, ravi_user, sarah_user, marcus_user, elena_user, gen_user])
        db.session.flush()

        # ── 2. Collectors ─────────────────────────────────────────
        print("[SEED] Creating 4 Collectors...")
        ravi_collector = Collector(
            user_id=ravi_user.id,
            phone=ravi_user.phone,
            rating=4.95,
            total_completed=12,
            current_workload=1,
            duty_status="AVAILABLE"
        )
        sarah_collector = Collector(
            user_id=sarah_user.id,
            phone=sarah_user.phone,
            rating=4.88,
            total_completed=15,
            current_workload=1,
            duty_status="AVAILABLE"
        )
        marcus_collector = Collector(
            user_id=marcus_user.id,
            phone=marcus_user.phone,
            rating=4.75,
            total_completed=8,
            current_workload=0,
            duty_status="AVAILABLE"
        )
        elena_collector = Collector(
            user_id=elena_user.id,
            phone=elena_user.phone,
            rating=4.90,
            total_completed=10,
            current_workload=0,
            duty_status="OFFLINE"
        )
        db.session.add_all([ravi_collector, sarah_collector, marcus_collector, elena_collector])
        db.session.flush()

        # ── 3. Vehicles (Must include TRUCK-03) ───────────────────
        print("[SEED] Creating 4 Vehicles (including TRUCK-03)...")
        v_truck03 = Vehicle(
            vehicle_number="TRUCK-03",
            vehicle_type="Compactor Truck",
            capacity_kg=2500.0,
            current_load_kg=450.0,
            status="IN_USE",
            assigned_collector_name="Ravi Kumar",
            battery_fuel="88% (EV)"
        )
        v_01 = Vehicle(
            vehicle_number="TRUCK-01",
            vehicle_type="Compactor Truck",
            capacity_kg=3500.0,
            current_load_kg=800.0,
            status="IN_USE",
            assigned_collector_name="Sarah Chen",
            battery_fuel="76% (EV)"
        )
        v_02 = Vehicle(
            vehicle_number="VAN-02",
            vehicle_type="Electric Van",
            capacity_kg=1200.0,
            current_load_kg=0.0,
            status="AVAILABLE",
            assigned_collector_name="Marcus Brody",
            battery_fuel="96% (EV)"
        )
        v_04 = Vehicle(
            vehicle_number="TRIKE-04",
            vehicle_type="Cargo Trike Auto",
            capacity_kg=400.0,
            current_load_kg=0.0,
            status="AVAILABLE",
            assigned_collector_name="Elena Rostova",
            battery_fuel="85% (EV)"
        )
        db.session.add_all([v_truck03, v_01, v_02, v_04])
        db.session.flush()

        # ── 4. Ravi Part-Time Availability ───────────────────────
        print("[SEED] Registering Ravi's part-time availability slots...")
        today = date.today()
        slot1 = CollectorAvailability(
            collector_id=ravi_collector.id,
            day_date=today,
            start_time=time(8, 0),
            end_time=time(13, 0),
            status="AVAILABLE"
        )
        slot2 = CollectorAvailability(
            collector_id=ravi_collector.id,
            day_date=today,
            start_time=time(14, 0),
            end_time=time(18, 0),
            status="AVAILABLE"
        )
        slot3 = CollectorAvailability(
            collector_id=sarah_collector.id,
            day_date=today,
            start_time=time(9, 0),
            end_time=time(17, 0),
            status="AVAILABLE"
        )
        db.session.add_all([slot1, slot2, slot3])

        # ── 5. 10 Waste Sources ──────────────────────────────────
        print("[SEED] Seeding 10 Waste Sources...")
        sources_data = [
            ("Metro Eco Supermarket", "Retail", "840 Commercial Way", 37.7749, -122.4194),
            ("Harbor Hotel & Suites", "Hospitality", "12 Marina Promenade", 37.7650, -122.4250),
            ("Apex Technology Campus", "Corporate", "400 Innovation Drive", 37.7900, -122.4000),
            ("GreenValley Condos Block A", "Residential", "220 Green Way, Sector 3", 37.7550, -122.4300),
            ("Cityview Medical Center", "Healthcare", "50 Health Plaza", 37.7800, -122.4100),
            ("Grand Horizon Mall", "Commercial", "120 Logistics Pkwy", 37.7833, -122.4167),
            ("BioLab Research Facility", "Corporate", "88 Science Park Drive", 37.7720, -122.4080),
            ("Bayfront Seafood Terminal", "Commercial", "300 Dockside Pier", 37.7600, -122.4100),
            ("Summit Office Tower", "Corporate", "100 Financial Boulevard", 37.7920, -122.3980),
            ("Sunset Heights Residential", "Residential", "65 Sunset Boulevard", 37.7500, -122.4400),
        ]

        sources = []
        for name, cat, addr, lat, lon in sources_data:
            s = WasteSource(
                user_id=gen_user.id,
                name=name,
                category=cat,
                address=addr,
                latitude=lat,
                longitude=lon,
                monthly_volume_kg=round(float(2500 + len(sources) * 450), 1),
                segregation_score=round(float(88.0 + (len(sources) % 10)), 1)
            )
            sources.append(s)
        db.session.add_all(sources)
        db.session.flush()

        # ── 6. 8 Smart Bins (BIN-001 must be 92% full & ~2h overflow) ──
        print("[SEED] Seeding 8 Smart Bins (BIN-001 @ 92% fill, 2h overflow)...")
        bins_data = [
            # bin_code, location, zone, waste_type, current_fill, prev_fill, fill_rate (rem/rate -> hours)
            # For BIN-001: remaining = 8%. fill_rate = 4.0% -> hours = 8 / 4 = 2.0 hrs!
            ("BIN-001", "Metro Central Plaza North", "Sector 4", "Plastics", 92.0, 84.0, 4.0, 37.7749, -122.4194),
            ("BIN-002", "Grand Market West Gate", "Sector 4", "Mixed Recyclables", 88.0, 78.0, 2.5, 37.7833, -122.4167),
            ("BIN-003", "Harbor Promenade Terminal", "Sector 2", "Organics", 64.0, 55.0, 1.8, 37.7650, -122.4250),
            ("BIN-004", "Apex Innovation Campus Courtyard", "Sector 1", "E-Waste", 45.0, 42.0, 0.8, 37.7900, -122.4000),
            ("BIN-005", "GreenValley Residential Sector 3", "Sector 3", "Cardboard", 78.0, 68.0, 2.0, 37.7550, -122.4300),
            ("BIN-006", "South Pier Promenade", "Sector 2", "Glass & Metals", 32.0, 28.0, 0.5, 37.7600, -122.4100),
            ("BIN-007", "Financial District Concourse", "Sector 1", "Paper & Packaging", 58.0, 50.0, 1.5, 37.7920, -122.3980),
            ("BIN-008", "Sunset Community Park", "Sector 3", "Organics", 24.0, 20.0, 0.4, 37.7500, -122.4400),
        ]

        smart_bins = []
        for code, loc, zone, wtype, curr, prev, rate, lat, lon in bins_data:
            sb = SmartBin(
                bin_code=code,
                location_name=loc,
                zone=zone,
                waste_type=wtype,
                current_fill_pct=curr,
                previous_fill_pct=prev,
                fill_rate_per_hour=rate,
                latitude=lat,
                longitude=lon,
                last_emptied_at=datetime.utcnow() - timedelta(hours=4)
            )
            smart_bins.append(sb)
        db.session.add_all(smart_bins)
        db.session.flush()

        # ── 7. 15 Pickup Requests & Journey Events ────────────────
        print("[SEED] Seeding 15 Pickup Requests (High priority + completed jobs for Ravi)...")
        now = datetime.utcnow()

        # Pickups definitions
        # Format: (code, src_idx, col_obj, veh_obj, waste_type, est_kg, pri, score, status, sched_time)
        pickups_spec = [
            ("PK-1001", 0, ravi_collector, v_truck03, "Plastics", 350.0, "HIGH", 88.5, "COLLECTED", "Yesterday 10:00 AM"),
            ("PK-1002", 0, ravi_collector, v_truck03, "Cardboard", 180.0, "HIGH", 82.0, "ASSIGNED", "10:30 AM Today"),
            ("PK-1003", 1, sarah_collector, v_01, "Organics", 420.0, "HIGH", 84.0, "COLLECTED", "Yesterday 02:00 PM"),
            ("PK-1004", 1, sarah_collector, v_01, "Organics", 320.0, "HIGH", 78.0, "ON_THE_WAY", "11:45 AM Today"),
            ("PK-1005", 2, marcus_collector, v_02, "E-Waste", 85.0, "MEDIUM", 58.0, "COLLECTED", "2 days ago"),
            ("PK-1006", 3, ravi_collector, v_truck03, "Cardboard", 140.0, "MEDIUM", 54.0, "COLLECTED", "2 days ago"),
            ("PK-1007", 4, sarah_collector, v_01, "Plastics", 220.0, "MEDIUM", 62.0, "COLLECTED", "3 days ago"),
            ("PK-1008", 5, None, None, "Plastics", 240.0, "HIGH", 92.0, "CREATED", "Immediate Dispatch"),
            ("PK-1009", 6, marcus_collector, v_02, "Glass & Metals", 190.0, "MEDIUM", 52.0, "COLLECTED", "3 days ago"),
            ("PK-1010", 7, ravi_collector, v_truck03, "Organics", 310.0, "HIGH", 76.0, "COLLECTED", "4 days ago"),
            ("PK-1011", 5, None, None, "Cardboard", 420.0, "HIGH", 85.0, "CREATED", "02:00 PM Today"),
            ("PK-1012", 8, sarah_collector, v_01, "Paper & Packaging", 260.0, "MEDIUM", 56.0, "COLLECTED", "4 days ago"),
            ("PK-1013", 9, marcus_collector, v_02, "Organics", 175.0, "LOW", 38.0, "COLLECTED", "5 days ago"),
            ("PK-1014", 2, None, None, "E-Waste", 120.0, "MEDIUM", 64.0, "CREATED", "Tomorrow 10:00 AM"),
            ("PK-1015", 3, None, None, "Plastics", 160.0, "MEDIUM", 60.0, "CREATED", "Tomorrow 01:00 PM"),
        ]

        pickups = []
        for code, s_idx, col, veh, wtype, kg, pri, sc, st, sched in pickups_spec:
            reason = f"{pri} priority because smart bin is elevated and scheduled dispatch window is active."
            p = PickupRequest(
                pickup_code=code,
                source_id=sources[s_idx].id,
                collector_id=col.id if col else None,
                vehicle_id=veh.id if veh else None,
                waste_type=wtype,
                estimated_weight_kg=kg,
                actual_weight_kg=kg if st in ['COLLECTED', 'SEGREGATED', 'RECOVERED', 'RECYCLED', 'DISPOSED'] else None,
                priority=pri,
                priority_score=sc,
                priority_reason=reason,
                status=st,
                scheduled_time=sched,
                notes=f"Operational collection request for {sources[s_idx].name}."
            )
            pickups.append(p)
        db.session.add_all(pickups)
        db.session.flush()

        # ── 8. Journey Events for All Pickups ────────────────────
        print("[SEED] Seeding Journey Events...")
        for p in pickups:
            # CREATED event
            e1 = JourneyEvent(
                pickup_id=p.id,
                stage="CREATED",
                status="COMPLETED",
                location=p.source.name,
                notes=f"Order logged for {p.estimated_weight_kg} kg {p.waste_type}.",
                timestamp=p.created_at - timedelta(hours=2)
            )
            db.session.add(e1)

            if p.status in ['ASSIGNED', 'ON_THE_WAY', 'COLLECTED']:
                col_name = p.collector.user.name if p.collector and p.collector.user else "Carrier"
                e2 = JourneyEvent(
                    pickup_id=p.id,
                    stage="ASSIGNED",
                    status="COMPLETED",
                    location="Central Dispatch",
                    notes=f"Assigned to {col_name}.",
                    timestamp=p.created_at - timedelta(hours=1)
                )
                db.session.add(e2)

            if p.status in ['ON_THE_WAY', 'COLLECTED']:
                e3 = JourneyEvent(
                    pickup_id=p.id,
                    stage="ON_THE_WAY",
                    status="COMPLETED",
                    location=f"Transit to {p.source.name}",
                    notes="Carrier en route.",
                    timestamp=p.created_at - timedelta(minutes=30)
                )
                db.session.add(e3)

            if p.status == 'COLLECTED':
                e4 = JourneyEvent(
                    pickup_id=p.id,
                    stage="COLLECTED",
                    status="COMPLETED",
                    location=p.source.name,
                    notes=f"Collected and verified on-board: {p.actual_weight_kg} kg.",
                    timestamp=p.created_at
                )
                db.session.add(e4)

        # ── 9. 10 Recovery Records & Collector Earnings ──────────
        print("[SEED] Seeding 10 Recovery Records and Collector Earnings...")
        collected_pickups = [p for p in pickups if p.status == 'COLLECTED'][:10]

        for idx, p in enumerate(collected_pickups):
            kg = p.actual_weight_kg or p.estimated_weight_kg
            recyc_kg = round(kg * 0.78, 1)
            recov_kg = round(kg * 0.70, 1)
            disp_kg = round(max(0.0, kg - recyc_kg), 1)

            rec_rate = round((recov_kg / kg) * 100.0, 1)
            recyc_rate = round((recyc_kg / kg) * 100.0, 1)
            div_rate = round(((recov_kg + recyc_kg) / (kg * 2.0)) * 100.0, 1)

            rec_record = RecoveryRecord(
                pickup_id=p.id,
                collected_quantity_kg=kg,
                recyclable_quantity_kg=recyc_kg,
                recovered_quantity_kg=recov_kg,
                disposed_quantity_kg=disp_kg,
                recovery_rate=rec_rate,
                recycling_rate=recyc_rate,
                diversion_rate=div_rate,
                facility_name="EcoLoop Central Recovery Hub" if idx % 2 == 0 else "GreenPoint Biocompost Plant"
            )
            db.session.add(rec_record)

            # Collector Earning
            if p.collector_id:
                base = 30.0
                dist_bonus = 10.0 if idx % 2 == 0 else 0.0
                pri_bonus = 15.0 if p.priority == 'HIGH' else 0.0
                weight_bonus = round((kg / 5.0) * 1.0, 2)
                tot = round(base + dist_bonus + pri_bonus + weight_bonus, 2)

                earning = CollectorEarning(
                    collector_id=p.collector_id,
                    pickup_id=p.id,
                    base_amount=base,
                    distance_bonus=dist_bonus,
                    priority_bonus=pri_bonus,
                    weight_bonus=weight_bonus,
                    total_amount=tot,
                    status="PAID" if idx < 7 else "PENDING"
                )
                db.session.add(earning)

        db.session.commit()
        print("[SUCCESS] Database successfully seeded with full WasteLoop demo state!")
        print("[INFO] Demo credentials:")
        print("   - Admin:     admin@wasteloop.com / admin123")
        print("   - Collector: ravi@wasteloop.com  / collector123 (Ravi Kumar with TRUCK-03)")
        print("   - Generator: user@wasteloop.com  / user123")
        print("   - Bin BIN-001: 92% full, ~2.0 hrs to overflow")

if __name__ == '__main__':
    run_seed()
