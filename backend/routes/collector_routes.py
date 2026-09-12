"""
Collector Route Endpoints
Collector directory, availability scheduling, job claiming with concurrency safety, and earnings.
"""
from datetime import datetime, date, time
from flask import Blueprint, request
from extensions import db
from models import Collector, CollectorAvailability, PickupRequest, Vehicle, JourneyEvent, CollectorEarning, User
from utils.responses import success_response, error_response
from utils.permissions import login_required, get_current_user_id, get_current_user_role

collector_bp = Blueprint('collector_bp', __name__)

@collector_bp.route('/api/collectors', methods=['GET'])
def get_collectors():
    collectors = Collector.query.filter_by(is_active=True).all()
    res = []
    for c in collectors:
        d = c.to_dict()
        d['status'] = c.duty_status.lower()
        d['completed_today'] = c.total_completed or 0
        # Find assigned vehicle
        v = Vehicle.query.filter_by(assigned_collector_name=c.user.name if c.user else '').first()
        d['vehicle'] = v.vehicle_number if v else 'Standard Fleet Unit'
        res.append(d)
    return success_response(data=res)

@collector_bp.route('/api/collectors/available', methods=['GET'])
def get_available_collectors():
    available = Collector.query.filter_by(is_active=True, duty_status='AVAILABLE').all()
    res = []
    for c in available:
        d = c.to_dict()
        d['status'] = c.duty_status.lower()
        d['completed_today'] = c.total_completed or 0
        v = Vehicle.query.filter_by(assigned_collector_name=c.user.name if c.user else '').first()
        d['vehicle'] = v.vehicle_number if v else 'Electric Van V-02'
        res.append(d)
    return success_response(data=res)

@collector_bp.route('/api/collectors/<int:collector_id>', methods=['GET'])
def get_collector_detail(collector_id):
    collector = Collector.query.get(collector_id)
    if not collector:
        return error_response(message="Collector not found.", error="NOT_FOUND", status_code=404)
    return success_response(data=collector.to_dict())

@collector_bp.route('/api/collectors/<int:collector_id>/availability', methods=['POST'])
def update_collector_availability(collector_id):
    collector = Collector.query.get(collector_id)
    if not collector:
        return error_response(message="Collector not found.", error="NOT_FOUND", status_code=404)

    data = request.get_json() or {}
    
    # Handle duty status toggle (e.g. 'AVAILABLE', 'BUSY', 'OFFLINE')
    if 'status' in data and not ('start_time' in data and 'end_time' in data):
        new_status = data['status'].upper()
        if new_status in ['AVAILABLE', 'BUSY', 'OFFLINE']:
            collector.duty_status = new_status
            db.session.commit()
            return success_response(data=collector.to_dict(), message=f"Duty status updated to {new_status}.")

    # Handle shift slot addition
    date_str = data.get('date', date.today().isoformat())
    start_str = data.get('start_time', '09:00')
    end_str = data.get('end_time', '17:00')
    slot_status = data.get('status', 'AVAILABLE').upper()

    try:
        slot_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        start_t = datetime.strptime(start_str, '%H:%M').time()
        end_t = datetime.strptime(end_str, '%H:%M').time()
    except ValueError:
        return error_response(message="Invalid date/time format. Use YYYY-MM-DD and HH:MM.", error="VALIDATION_ERROR", status_code=422)

    if start_t >= end_t:
        return error_response(message="Start time must be strictly before end time.", error="VALIDATION_ERROR", status_code=422)

    # Check for overlapping slots
    existing_slots = CollectorAvailability.query.filter_by(
        collector_id=collector.id,
        day_date=slot_date
    ).all()

    for s in existing_slots:
        if not (end_t <= s.start_time or start_t >= s.end_time):
            return error_response(
                message=f"Time slot overlaps with existing shift ({s.start_time.strftime('%H:%M')} - {s.end_time.strftime('%H:%M')}).",
                error="SLOT_CONFLICT",
                status_code=409
            )

    new_slot = CollectorAvailability(
        collector_id=collector.id,
        day_date=slot_date,
        start_time=start_t,
        end_time=end_t,
        status=slot_status
    )
    db.session.add(new_slot)
    db.session.commit()

    return success_response(data=new_slot.to_dict(), message="Availability shift slot registered.", status_code=201)

@collector_bp.route('/api/collectors/<int:collector_id>/accept-job', methods=['POST'])
def accept_pickup_job(collector_id):
    collector = Collector.query.get(collector_id)
    if not collector:
        return error_response(message="Collector not found.", error="NOT_FOUND", status_code=404)

    data = request.get_json() or {}
    pickup_ref = data.get('pickup_id')
    if not pickup_ref:
        return error_response(message="pickup_id is required.", error="VALIDATION_ERROR", status_code=422)

    # Concurrency safe check using transaction
    try:
        pickup = PickupRequest.query.filter(
            (PickupRequest.pickup_code == str(pickup_ref)) | (PickupRequest.id == str(pickup_ref))
        ).with_for_update().first()

        if not pickup:
            return error_response(message="Pickup request not found.", error="NOT_FOUND", status_code=404)

        # 1. Verify pickup is still available
        if pickup.status != 'CREATED' or pickup.collector_id is not None:
            return error_response(
                message=f"Pickup #{pickup.pickup_code} is no longer available. It has already been assigned.",
                error="JOB_ALREADY_ASSIGNED",
                status_code=409
            )

        # 2. Verify vehicle capacity
        vehicle = Vehicle.query.filter_by(assigned_collector_name=collector.user.name if collector.user else '').first()
        if not vehicle:
            vehicle = Vehicle.query.filter_by(status='AVAILABLE').first()
            if not vehicle:
                vehicle = Vehicle.query.first()

        if vehicle and (vehicle.capacity_kg - vehicle.current_load_kg) < pickup.estimated_weight_kg:
            return error_response(
                message=f"Vehicle capacity ({vehicle.capacity_kg} kg) exceeded by pickup payload ({pickup.estimated_weight_kg} kg).",
                error="CAPACITY_EXCEEDED",
                status_code=409
            )

        # 3. Assign collector and update status
        pickup.collector_id = collector.id
        pickup.status = 'ASSIGNED'
        if vehicle:
            pickup.vehicle_id = vehicle.id
            vehicle.status = 'IN_USE'
            vehicle.assigned_collector_name = collector.user.name if collector.user else 'Assigned'

        collector.current_workload = (collector.current_workload or 0) + 1

        # 4. Create JourneyEvent
        event = JourneyEvent(
            pickup_id=pickup.id,
            stage='ASSIGNED',
            status='COMPLETED',
            location='Carrier Acceptance',
            notes=f"Accepted by collector {collector.user.name if collector.user else 'Collector'}."
        )
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(message=str(e), error="TRANSACTION_FAILED", status_code=500)

    return success_response(data=pickup.to_dict(), message=f"Pickup #{pickup.pickup_code} successfully claimed and assigned to your route.")

@collector_bp.route('/api/collectors/<int:collector_id>/earnings', methods=['GET'])
def get_collector_earnings(collector_id):
    collector = Collector.query.get(collector_id)
    if not collector:
        return error_response(message="Collector not found.", error="NOT_FOUND", status_code=404)

    earnings = CollectorEarning.query.filter_by(collector_id=collector_id).order_by(CollectorEarning.created_at.desc()).all()
    total_earned = sum([e.total_amount for e in earnings])

    return success_response(data={
        'collector_id': collector_id,
        'collector_name': collector.user.name if collector.user else 'Collector',
        'total_earnings_usd': round(total_earned, 2),
        'records_count': len(earnings),
        'earnings': [e.to_dict() for e in earnings]
    })
