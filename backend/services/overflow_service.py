"""
Smart Bin Overflow Engine
Predictive overflow calculations and automated dispatch generation.
"""
from datetime import datetime
from extensions import db
from models import SmartBin, WasteSource, PickupRequest, JourneyEvent, User
from services.priority_service import calculate_priority_score

def calculate_overflow_prediction(current_fill: float, fill_rate: float) -> dict:
    """
    remaining capacity = 100 - current fill
    hours to overflow = remaining capacity / fill rate
    """
    remaining = max(0.0, 100.0 - current_fill)
    if fill_rate <= 0:
        return {
            'hours_to_overflow': None,
            'overflow_trend': "No current overflow trend",
            'risk_level': "LOW"
        }

    hours = round(remaining / fill_rate, 1)
    is_high_risk = hours < 6.0 or current_fill >= 90.0

    return {
        'hours_to_overflow': hours,
        'overflow_trend': f"Predicted overflow in {hours} hours",
        'risk_level': "HIGH" if is_high_risk else ("MEDIUM" if hours < 12.0 else "LOW")
    }

def create_pickup_from_bin(bin_id: int) -> tuple[dict, str]:
    """
    Generates an automated pickup request from a smart bin sensor event.
    Atomic transaction guarantees clean creation and audit logging.
    """
    smart_bin = SmartBin.query.get(bin_id)
    if not smart_bin:
        # Check by bin_code
        smart_bin = SmartBin.query.filter_by(bin_code=str(bin_id)).first()
        if not smart_bin:
            return None, f"Smart Bin '{bin_id}' not found."

    # Estimated weight calculation based on fill percentage (assuming 300kg standard bin)
    est_weight = round(max(30.0, (smart_bin.current_fill_pct / 100.0) * 300.0), 1)

    # 1. Get or create automated source for this bin location
    admin_user = User.query.filter_by(role='ADMIN').first()
    user_id = admin_user.id if admin_user else 1

    source_name = f"Smart Bin Node - {smart_bin.location_name}"
    source = WasteSource.query.filter_by(name=source_name).first()
    if not source:
        source = WasteSource(
            user_id=user_id,
            name=source_name,
            category='Municipal IoT',
            address=f"{smart_bin.location_name} ({smart_bin.zone})",
            latitude=smart_bin.latitude,
            longitude=smart_bin.longitude,
            monthly_volume_kg=est_weight * 10,
            segregation_score=94.0
        )
        db.session.add(source)
        db.session.flush()

    # 2. Evaluate overflow prediction & explainable priority
    prediction = calculate_overflow_prediction(smart_bin.current_fill_pct, smart_bin.fill_rate_per_hour)
    priority_res = calculate_priority_score(
        fill_pct=smart_bin.current_fill_pct,
        weight_kg=est_weight,
        waste_type=smart_bin.waste_type,
        waiting_hours=1.0,
        overflow_risk=prediction['risk_level']
    )

    # 3. Create Pickup Request
    code_num = PickupRequest.query.count() + 1001
    pickup_code = f"PK-{code_num}"

    pickup = PickupRequest(
        pickup_code=pickup_code,
        source_id=source.id,
        waste_type=smart_bin.waste_type,
        estimated_weight_kg=est_weight,
        priority=priority_res['priority'],
        priority_score=priority_res['score'],
        priority_reason=priority_res['reason'],
        status='CREATED',
        scheduled_time='Immediate Dispatch (IoT Trigger)',
        notes=f"Automated pickup triggered by Smart Bin {smart_bin.bin_code} at {smart_bin.current_fill_pct}% fill."
    )
    db.session.add(pickup)
    db.session.flush()

    # 4. Create Initial JourneyEvent
    event = JourneyEvent(
        pickup_id=pickup.id,
        stage='CREATED',
        status='COMPLETED',
        location=smart_bin.location_name,
        notes=f"Sensor trigger: Bin #{smart_bin.bin_code} hit {smart_bin.current_fill_pct}% fill. Priority: {priority_res['priority']}."
    )
    db.session.add(event)
    db.session.commit()

    return pickup.to_dict(), None
