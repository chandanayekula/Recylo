"""
Smart Bin Route Endpoints
IoT sensor telemetry queries, manual updates, and automated overflow pickup dispatches.
"""
from flask import Blueprint, request
from extensions import db
from models import SmartBin
from services.overflow_service import create_pickup_from_bin
from utils.responses import success_response, error_response

bin_bp = Blueprint('bin_bp', __name__)

@bin_bp.route('/api/bins', methods=['GET'])
def get_bins():
    bins = SmartBin.query.order_by(SmartBin.current_fill_pct.desc()).all()
    return success_response(data=[b.to_dict() for b in bins])

@bin_bp.route('/api/bins/<identifier>', methods=['GET'])
def get_bin_detail(identifier):
    b = SmartBin.query.filter((SmartBin.bin_code == identifier) | (SmartBin.id == identifier)).first()
    if not b:
        return error_response(message="Smart bin not found.", error="NOT_FOUND", status_code=404)
    return success_response(data=b.to_dict())

@bin_bp.route('/api/bins/<identifier>', methods=['PUT'])
def update_bin(identifier):
    b = SmartBin.query.filter((SmartBin.bin_code == identifier) | (SmartBin.id == identifier)).first()
    if not b:
        return error_response(message="Smart bin not found.", error="NOT_FOUND", status_code=404)

    data = request.get_json() or {}
    if 'current_fill_pct' in data:
        b.previous_fill_pct = b.current_fill_pct
        b.current_fill_pct = float(data['current_fill_pct'])
    if 'fill_rate_per_hour' in data:
        b.fill_rate_per_hour = float(data['fill_rate_per_hour'])
    if 'location' in data:
        b.location_name = str(data['location'])

    db.session.commit()
    return success_response(data=b.to_dict(), message="Smart bin telemetry updated.")

@bin_bp.route('/api/bins/<identifier>/create-pickup', methods=['POST'])
def trigger_bin_pickup(identifier):
    pickup_dict, err = create_pickup_from_bin(identifier)
    if err:
        return error_response(message=err, error="BIN_DISPATCH_FAILED", status_code=404)

    return success_response(
        data=pickup_dict,
        message=f"Pickup #{pickup_dict['id']} dispatched for Smart Bin {identifier}.",
        status_code=201
    )
