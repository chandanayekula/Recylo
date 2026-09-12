"""
Pickup Routes
Lifecycle state machine, assignment, collection completion, and journey tracking.
"""
from datetime import datetime
from flask import Blueprint, request
from extensions import db
from models import PickupRequest, WasteSource, Collector, Vehicle, JourneyEvent, RecoveryRecord, CollectorEarning
from services.priority_service import calculate_priority_score
from services.recovery_service import calculate_recovery_rates
from services.earnings_service import calculate_collector_earnings
from utils.responses import success_response, error_response
from utils.validators import validate_status_transition, validate_collection_quantities
from utils.permissions import login_required, get_current_user_id, get_current_user_role

pickup_bp = Blueprint('pickup_bp', __name__)

@pickup_bp.route('/api/pickups', methods=['GET'])
def get_pickups():
    user_id = get_current_user_id()
    user_role = get_current_user_role()

    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    collector_id = request.args.get('collector_id')

    query = PickupRequest.query

    # Role enforcement
    if user_role == 'GENERATOR' and user_id:
        query = query.join(WasteSource).filter(WasteSource.user_id == user_id)
    elif user_role == 'COLLECTOR' and user_id:
        collector = Collector.query.filter_by(user_id=user_id).first()
        if collector:
            if status_filter == 'available':
                query = query.filter(PickupRequest.status == 'CREATED', PickupRequest.collector_id.is_(None))
            else:
                query = query.filter((PickupRequest.collector_id == collector.id) | (PickupRequest.status == 'CREATED'))

    if status_filter and status_filter != 'available':
        query = query.filter(PickupRequest.status == status_filter.upper())

    if priority_filter:
        query = query.filter(PickupRequest.priority == priority_filter.upper())

    if collector_id:
        query = query.filter(PickupRequest.collector_id == int(collector_id))

    pickups = query.order_by(PickupRequest.created_at.desc()).all()
    return success_response(data=[p.to_dict() for p in pickups])

@pickup_bp.route('/api/pickups', methods=['POST'])
def create_pickup():
    data = request.get_json() or {}
    source_id = data.get('source_id')
    waste_type = data.get('waste_type', 'Plastics')
    weight_kg = float(data.get('estimated_weight_kg', 100.0))
    scheduled_time = data.get('scheduled_time', 'Standard Scheduled')
    notes = data.get('notes', '')

    # 1. Validate source
    source = None
    if source_id:
        source = WasteSource.query.get(source_id)
    if not source:
        # Fallback to first source or create standard source
        source = WasteSource.query.first()
        if not source:
            source = WasteSource(user_id=1, name='Central Metro Facility', category='Commercial', address='Downtown Plaza')
            db.session.add(source)
            db.session.flush()

    # 2. Validate quantity
    if weight_kg <= 0:
        return error_response(message="Estimated weight must be greater than 0 kg.", error="VALIDATION_ERROR", status_code=422)

    # 3. Calculate Explainable Smart Priority Score
    priority_res = calculate_priority_score(
        fill_pct=50.0,
        weight_kg=weight_kg,
        waste_type=waste_type,
        waiting_hours=0.5,
        overflow_risk='LOW'
    )

    # 4. Save Pickup
    code_num = PickupRequest.query.count() + 1001
    pickup_code = f"PK-{code_num}"

    pickup = PickupRequest(
        pickup_code=pickup_code,
        source_id=source.id,
        waste_type=waste_type,
        estimated_weight_kg=weight_kg,
        priority=priority_res['priority'],
        priority_score=priority_res['score'],
        priority_reason=priority_res['reason'],
        status='CREATED',
        scheduled_time=scheduled_time,
        notes=notes
    )
    db.session.add(pickup)
    db.session.flush()

    # 5. Create CREATED JourneyEvent
    event = JourneyEvent(
        pickup_id=pickup.id,
        stage='CREATED',
        status='COMPLETED',
        location=source.name,
        notes=f"Pickup order logged. Estimated {weight_kg} kg {waste_type}. Priority: {priority_res['priority']}."
    )
    db.session.add(event)
    db.session.commit()

    return success_response(data=pickup.to_dict(), message="Pickup request scheduled successfully.", status_code=201)

@pickup_bp.route('/api/pickups/<identifier>', methods=['GET'])
def get_pickup_detail(identifier):
    pickup = PickupRequest.query.filter(
        (PickupRequest.pickup_code == identifier) | (PickupRequest.id == identifier)
    ).first()
    if not pickup:
        return error_response(message="Pickup not found.", error="NOT_FOUND", status_code=404)
    return success_response(data=pickup.to_dict())

@pickup_bp.route('/api/pickups/<identifier>/assign', methods=['POST'])
def assign_pickup_route(identifier):
    pickup = PickupRequest.query.filter(
        (PickupRequest.pickup_code == identifier) | (PickupRequest.id == identifier)
    ).first()
    if not pickup:
        return error_response(message="Pickup not found.", error="NOT_FOUND", status_code=404)

    data = request.get_json() or {}
    collector_id = data.get('collector_id')
    collector_name = data.get('collector_name')
    vehicle_id = data.get('vehicle_id')

    collector = None
    if collector_id:
        collector = Collector.query.get(collector_id)
    elif collector_name:
        # Lookup collector by user name
        col_list = Collector.query.all()
        for c in col_list:
            if c.user and collector_name.lower() in c.user.name.lower():
                collector = c
                break

    if not collector:
        collector = Collector.query.filter_by(is_active=True).first()

    if not collector:
        return error_response(message="No active collectors available.", error="RESOURCE_UNAVAILABLE", status_code=409)

    vehicle = Vehicle.query.get(vehicle_id) if vehicle_id else Vehicle.query.filter_by(status='AVAILABLE').first()
    if not vehicle:
        vehicle = Vehicle.query.first()

    # Check vehicle capacity
    if vehicle and (vehicle.capacity_kg - vehicle.current_load_kg) < pickup.estimated_weight_kg:
        return error_response(message=f"Vehicle {vehicle.vehicle_number} has insufficient capacity for {pickup.estimated_weight_kg} kg.", error="CAPACITY_EXCEEDED", status_code=409)

    # Database Transaction
    try:
        pickup.collector_id = collector.id
        if vehicle:
            pickup.vehicle_id = vehicle.id
            vehicle.status = 'IN_USE'
            vehicle.assigned_collector_name = collector.user.name if collector.user else 'Assigned'

        pickup.status = 'ASSIGNED'
        collector.current_workload = (collector.current_workload or 0) + 1

        # Create JourneyEvent
        event = JourneyEvent(
            pickup_id=pickup.id,
            stage='ASSIGNED',
            status='COMPLETED',
            location='Operations Dispatch',
            notes=f"Assigned to collector {collector.user.name if collector.user else 'Collector'} ({vehicle.vehicle_number if vehicle else 'Fleet'})."
        )
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(message=str(e), error="TRANSACTION_FAILED", status_code=500)

    return success_response(data=pickup.to_dict(), message="Collector assigned successfully.")

@pickup_bp.route('/api/pickups/<identifier>/status', methods=['POST'])
def update_pickup_status(identifier):
    pickup = PickupRequest.query.filter(
        (PickupRequest.pickup_code == identifier) | (PickupRequest.id == identifier)
    ).first()
    if not pickup:
        return error_response(message="Pickup not found.", error="NOT_FOUND", status_code=404)

    data = request.get_json() or {}
    target_status = data.get('status', '').upper()
    notes = data.get('notes', '')

    # Strict status transition check
    valid, msg = validate_status_transition(pickup.status, target_status)
    if not valid:
        return error_response(message=msg, error="INVALID_TRANSITION", status_code=409)

    # Database Transaction
    try:
        pickup.status = target_status
        pickup.updated_at = datetime.utcnow()

        # Handle COLLECTION COMPLETION
        if target_status == 'COLLECTED':
            collected_kg = float(data.get('actual_weight_kg') or data.get('collected_quantity') or pickup.estimated_weight_kg)
            recyclable_kg = float(data.get('recyclable_quantity', collected_kg * 0.75))
            recovered_kg = float(data.get('recovered_quantity', collected_kg * 0.65))
            disposed_kg = float(data.get('disposed_quantity', max(0.0, collected_kg - recyclable_kg)))

            # Validate quantities
            q_valid, q_msg = validate_collection_quantities(collected_kg, recyclable_kg, recovered_kg, disposed_kg)
            if not q_valid:
                return error_response(message=q_msg, error="VALIDATION_ERROR", status_code=422)

            pickup.actual_weight_kg = collected_kg

            # 1. Create or update RecoveryRecord
            rates = calculate_recovery_rates(collected_kg, recyclable_kg, recovered_kg, disposed_kg)
            rec_record = RecoveryRecord.query.filter_by(pickup_id=pickup.id).first()
            if not rec_record:
                rec_record = RecoveryRecord(
                    pickup_id=pickup.id,
                    collected_quantity_kg=collected_kg,
                    recyclable_quantity_kg=recyclable_kg,
                    recovered_quantity_kg=recovered_kg,
                    disposed_quantity_kg=disposed_kg,
                    recovery_rate=rates['recovery_rate'],
                    recycling_rate=rates['recycling_rate'],
                    diversion_rate=rates['diversion_rate']
                )
                db.session.add(rec_record)
            else:
                rec_record.collected_quantity_kg = collected_kg
                rec_record.recyclable_quantity_kg = recyclable_kg
                rec_record.recovered_quantity_kg = recovered_kg
                rec_record.disposed_quantity_kg = disposed_kg
                rec_record.recovery_rate = rates['recovery_rate']
                rec_record.recycling_rate = rates['recycling_rate']
                rec_record.diversion_rate = rates['diversion_rate']

            # 2. Calculate Collector Earning
            if pickup.collector_id:
                earning_calc = calculate_collector_earnings(
                    weight_kg=collected_kg,
                    priority=pickup.priority,
                    distance_km=2.5
                )
                earning = CollectorEarning.query.filter_by(pickup_id=pickup.id).first()
                if not earning:
                    earning = CollectorEarning(
                        collector_id=pickup.collector_id,
                        pickup_id=pickup.id,
                        base_amount=earning_calc['base_amount'],
                        distance_bonus=earning_calc['distance_bonus'],
                        priority_bonus=earning_calc['priority_bonus'],
                        weight_bonus=earning_calc['weight_bonus'],
                        total_amount=earning_calc['total_amount'],
                        status='PENDING'
                    )
                    db.session.add(earning)

                # 3. Update collector metrics
                collector = Collector.query.get(pickup.collector_id)
                if collector:
                    collector.total_completed = (collector.total_completed or 0) + 1
                    collector.current_workload = max(0, (collector.current_workload or 1) - 1)

        # Create JourneyEvent
        event = JourneyEvent(
            pickup_id=pickup.id,
            stage=target_status,
            status='COMPLETED',
            location=pickup.source.name if pickup.source else 'En route',
            notes=notes or f"Pickup status transitioned to {target_status}."
        )
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return error_response(message=str(e), error="TRANSACTION_FAILED", status_code=500)

    return success_response(data=pickup.to_dict(), message=f"Pickup status updated to {target_status}.")

@pickup_bp.route('/api/pickups/<identifier>/journey', methods=['GET'])
def get_pickup_journey(identifier):
    pickup = PickupRequest.query.filter(
        (PickupRequest.pickup_code == identifier) | (PickupRequest.id == identifier)
    ).first()
    if not pickup:
        return error_response(message="Pickup not found.", error="NOT_FOUND", status_code=404)

    events = [e.to_dict() for e in pickup.journey_events]
    return success_response(data={
        'pickup': pickup.to_dict(),
        'events': events,
        'recovery': pickup.recovery_record.to_dict() if pickup.recovery_record else None,
        'earning': pickup.earning.to_dict() if pickup.earning else None
    })
