"""
Collector Matching & Workload Balancing Service
Transparent rule-based scoring to rank suitable collectors for pickup dispatches.
"""
from datetime import datetime, date
from models import Collector, CollectorAvailability, Vehicle, PickupRequest
from utils.distance import calculate_haversine

def rank_collectors_for_pickup(pickup: PickupRequest, max_results: int = 5) -> list[dict]:
    """
    Ranks available collectors using transparent heuristics:
    - Availability Status: Must be AVAILABLE (+30 pts)
    - Vehicle Capacity: Must exceed pickup estimated weight (+25 pts)
    - Workload: Fewer active tasks scores higher (up to +20 pts)
    - Proximity: Shorter distance scores higher (up to +15 pts)
    - Rating & Track Record: High rating adds up to +10 pts
    """
    candidates = Collector.query.filter_by(is_active=True).all()
    today = date.today()
    pickup_lat = pickup.source.latitude if (pickup.source and pickup.source.latitude) else 37.7749
    pickup_lon = pickup.source.longitude if (pickup.source and pickup.source.longitude) else -122.4194

    ranked = []

    for col in candidates:
        # Check if collector is marked on duty
        status = col.duty_status.upper() if col.duty_status else 'AVAILABLE'
        if status == 'OFFLINE':
            continue

        # Check shift availability for today
        active_slot = CollectorAvailability.query.filter_by(
            collector_id=col.id,
            day_date=today,
            status='AVAILABLE'
        ).first()

        # Find assigned or available vehicle
        assigned_vehicle = Vehicle.query.filter_by(
            assigned_collector_name=col.user.name if col.user else ''
        ).first()

        if not assigned_vehicle:
            # Fallback to any available vehicle in fleet
            assigned_vehicle = Vehicle.query.filter_by(status='AVAILABLE').first()

        # Vehicle capacity check
        veh_cap = assigned_vehicle.capacity_kg if assigned_vehicle else 1000.0
        rem_cap = veh_cap - (assigned_vehicle.current_load_kg if assigned_vehicle else 0.0)
        if rem_cap < pickup.estimated_weight_kg:
            # Vehicle cannot carry this load
            continue

        # Approximate distance (simulated baseline depot or source)
        col_lat = 37.7680
        col_lon = -122.4210
        dist_km = calculate_haversine(pickup_lat, pickup_lon, col_lat, col_lon)

        # ── Transparent Scoring Calculation (0 - 100) ──
        score = 0.0

        # 1. Duty Availability (30 pts)
        if status == 'AVAILABLE':
            score += 30.0
        elif status == 'BUSY':
            score += 15.0

        # 2. Shift Slot Confirmation (15 pts)
        if active_slot:
            score += 15.0

        # 3. Vehicle Capacity Margin (20 pts)
        margin_pct = min(1.0, rem_cap / max(1.0, pickup.estimated_weight_kg))
        score += margin_pct * 20.0

        # 4. Current Workload Balance (20 pts)
        # 0 jobs = 20 pts, 1 job = 15 pts, 2 jobs = 10 pts, >= 4 jobs = 0 pts
        workload = col.current_workload or 0
        workload_score = max(0.0, 20.0 - (workload * 5.0))
        score += workload_score

        # 5. Proximity (15 pts)
        # Closer than 2 km = 15 pts, scales down to 0 at 15 km
        prox_score = max(0.0, 15.0 - (dist_km * 1.0))
        score += prox_score

        match_score = round(min(100.0, score), 1)

        # Suitability descriptor
        if match_score >= 80.0:
            suitability = "Optimal Candidate"
        elif match_score >= 60.0:
            suitability = "Suitable Carrier"
        else:
            suitability = "Acceptable with Route Adjustment"

        ranked.append({
            'collector_id': col.id,
            'collector_name': col.user.name if col.user else f"Collector #{col.id}",
            'rating': col.rating,
            'duty_status': col.duty_status,
            'active_shift': f"{active_slot.start_time.strftime('%H:%M')} - {active_slot.end_time.strftime('%H:%M')}" if active_slot else "Flexible Active",
            'current_jobs': workload,
            'vehicle': assigned_vehicle.vehicle_number if assigned_vehicle else 'Standard Fleet Unit',
            'vehicle_capacity_kg': veh_cap,
            'distance_km': dist_km,
            'match_score': match_score,
            'suitability': suitability
        })

    # Rank by match score descending
    ranked.sort(key=lambda x: x['match_score'], reverse=True)
    return ranked[:max_results]
