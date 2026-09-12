"""
Recovery & Circular Analytics Routes
Aggregates material recovery records, diversion indices, and processing facility metrics.
"""
from flask import Blueprint, request
from sqlalchemy import func
from extensions import db
from models import RecoveryRecord, PickupRequest
from services.recovery_service import calculate_recovery_rates
from services.circularity_service import compute_circularity_score
from utils.responses import success_response, error_response
from utils.validators import validate_collection_quantities

recovery_bp = Blueprint('recovery_bp', __name__)

@recovery_bp.route('/api/recovery', methods=['GET'])
def get_recovery_overview():
    records = RecoveryRecord.query.order_by(RecoveryRecord.created_at.desc()).all()

    totals = db.session.query(
        func.sum(RecoveryRecord.collected_quantity_kg),
        func.sum(RecoveryRecord.recyclable_quantity_kg),
        func.sum(RecoveryRecord.recovered_quantity_kg),
        func.sum(RecoveryRecord.disposed_quantity_kg)
    ).first()

    collected = float(totals[0] or 0.0)
    recyclable = float(totals[1] or 0.0)
    recovered = float(totals[2] or 0.0)
    disposed = float(totals[3] or 0.0)

    rates = calculate_recovery_rates(collected, recyclable, recovered, disposed)
    circularity = compute_circularity_score(rates['recovery_rate'], rates['recycling_rate'], rates['diversion_rate'])

    # Material Stream Breakdown
    stream_totals = db.session.query(
        PickupRequest.waste_type,
        func.sum(RecoveryRecord.recovered_quantity_kg)
    ).join(RecoveryRecord, RecoveryRecord.pickup_id == PickupRequest.id).group_by(PickupRequest.waste_type).all()

    materials = []
    colors = ['#22c55e', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4']
    for idx, (stream, weight) in enumerate(stream_totals):
        w = float(weight or 0.0)
        pct = round((w / max(1.0, recovered)) * 100.0, 1)
        materials.append({
            'material': stream,
            'recovered_kg': round(w, 1),
            'percentage': pct,
            'color': colors[idx % len(colors)],
            'method': 'Optical Sorting & Closed-Loop Pelleting'
        })

    # Facilities Breakdown
    facilities = [
        {'name': 'EcoLoop Central Recovery Hub', 'throughput': f"{int(recovered * 0.45):,} kg", 'status': 'Optimal', 'efficiency': '94%'},
        {'name': 'GreenPoint Biocompost Plant', 'throughput': f"{int(recovered * 0.30):,} kg", 'status': 'Optimal', 'efficiency': '91%'},
        {'name': 'Metro Clean E-Cycle Facility', 'throughput': f"{int(recovered * 0.25):,} kg", 'status': 'Active', 'efficiency': '87%'}
    ]

    return success_response(data={
        'summary': {
            'total_recovered_kg': round(recovered, 1),
            'total_recyclable_kg': round(recyclable, 1),
            'total_diverted_kg': round(recovered + recyclable, 1),
            'total_disposed_kg': round(disposed, 1),
            'recovery_rate_pct': rates['recovery_rate'],
            'recycling_rate_pct': rates['recycling_rate'],
            'diversion_rate_pct': rates['diversion_rate'],
            'co2_avoided_kg': round(recovered * 1.35, 1),
            'circularity_index': circularity['score']
        },
        'material_breakdown': materials,
        'facilities': facilities,
        'records': [r.to_dict() for r in records[:20]]
    })

@recovery_bp.route('/api/recovery', methods=['POST'])
def create_recovery_record():
    data = request.get_json() or {}
    pickup_id = data.get('pickup_id')
    collected = float(data.get('collected_quantity_kg', 0.0))
    recyclable = float(data.get('recyclable_quantity_kg', 0.0))
    recovered = float(data.get('recovered_quantity_kg', 0.0))
    disposed = float(data.get('disposed_quantity_kg', 0.0))

    valid, msg = validate_collection_quantities(collected, recyclable, recovered, disposed)
    if not valid:
        return error_response(message=msg, error="VALIDATION_ERROR", status_code=422)

    rates = calculate_recovery_rates(collected, recyclable, recovered, disposed)

    rec = RecoveryRecord(
        pickup_id=pickup_id,
        collected_quantity_kg=collected,
        recyclable_quantity_kg=recyclable,
        recovered_quantity_kg=recovered,
        disposed_quantity_kg=disposed,
        recovery_rate=rates['recovery_rate'],
        recycling_rate=rates['recycling_rate'],
        diversion_rate=rates['diversion_rate'],
        facility_name=data.get('facility_name', 'EcoLoop Central Recovery Hub')
    )
    db.session.add(rec)
    db.session.commit()

    return success_response(data=rec.to_dict(), message="Recovery record logged successfully.", status_code=201)
