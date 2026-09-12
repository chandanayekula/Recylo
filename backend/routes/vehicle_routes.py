"""
Vehicle Fleet Routes
Lists collection vehicles, capacities, and driver assignments.
"""
from flask import Blueprint
from models import Vehicle
from utils.responses import success_response

vehicle_bp = Blueprint('vehicle_bp', __name__)

@vehicle_bp.route('/api/vehicles', methods=['GET'])
def get_vehicles():
    vehicles = Vehicle.query.order_by(Vehicle.id.asc()).all()
    return success_response(data=[v.to_dict() for v in vehicles])
