"""
Journey Routes
Global waste journey provenance and event timelines.
"""
from flask import Blueprint, request
from models import JourneyEvent, PickupRequest
from utils.responses import success_response, error_response

journey_bp = Blueprint('journey_bp', __name__)

@journey_bp.route('/api/journey', methods=['GET'])
def get_journey_events():
    pickup_ref = request.args.get('pickup_id') or request.args.get('pickup_code')
    if pickup_ref:
        pickup = PickupRequest.query.filter(
            (PickupRequest.pickup_code == str(pickup_ref)) | (PickupRequest.id == str(pickup_ref))
        ).first()
        if not pickup:
            return error_response(message="Pickup not found", error="NOT_FOUND", status_code=404)
        events = JourneyEvent.query.filter_by(pickup_id=pickup.id).order_by(JourneyEvent.timestamp.asc()).all()
        return success_response(data={
            'pickup': pickup.to_dict(),
            'events': [e.to_dict() for e in events]
        })

    events = JourneyEvent.query.order_by(JourneyEvent.timestamp.desc()).limit(100).all()
    return success_response(data=[e.to_dict() for e in events])

@journey_bp.route('/api/journey/<pickup_ref>', methods=['GET'])
def get_pickup_journey(pickup_ref):
    pickup = PickupRequest.query.filter(
        (PickupRequest.pickup_code == str(pickup_ref)) | (PickupRequest.id == str(pickup_ref))
    ).first()
    if not pickup:
        return error_response(message="Pickup not found", error="NOT_FOUND", status_code=404)

    events = JourneyEvent.query.filter_by(pickup_id=pickup.id).order_by(JourneyEvent.timestamp.asc()).all()
    return success_response(data={
        'pickup': pickup.to_dict(),
        'events': [e.to_dict() for e in events]
    })
