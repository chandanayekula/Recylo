"""
Map & Route Optimization Routes
Feeds Leaflet map views with real-time GPS telemetry pins and nearest-neighbor paths.
"""
from flask import Blueprint, request
from models import SmartBin, Vehicle, PickupRequest
from services.route_service import generate_optimized_route, DEPOT_COORDINATES
from utils.responses import success_response

map_bp = Blueprint('map_bp', __name__)

@map_bp.route('/api/map', methods=['GET'])
def get_map_telemetry():
    bins = SmartBin.query.all()
    vehicles = Vehicle.query.all()
    active_pickups = PickupRequest.query.filter(
        PickupRequest.status.in_(['CREATED', 'ASSIGNED', 'ON_THE_WAY'])
    ).all()

    return success_response(data={
        'depot': DEPOT_COORDINATES,
        'smart_bins': [b.to_dict() for b in bins],
        'vehicles': [v.to_dict() for v in vehicles],
        'pickups': [p.to_dict() for p in active_pickups]
    })

@map_bp.route('/api/route', methods=['GET'])
def get_optimized_route():
    collector_id = request.args.get('collector_id', type=int)
    route_data = generate_optimized_route(collector_id=collector_id)
    return success_response(data=route_data, message="Optimized collection route generated.")
