"""
Route Optimization Service
Orders collection stops using nearest-neighbor heuristic from central depot.
"""
from utils.distance import calculate_haversine
from models import PickupRequest

DEPOT_COORDINATES = {
    'latitude': 37.7749,
    'longitude': -122.4194,
    'name': 'EcoLoop Central Operations Depot'
}

def generate_optimized_route(collector_id: int = None, depot_coords: dict = None) -> dict:
    """
    Computes an ordered sequential route using greedy nearest-neighbor algorithm.
    Prioritizes HIGH priority stops first, then sequences by geographic proximity.
    """
    depot = depot_coords or DEPOT_COORDINATES
    depot_lat = depot['latitude']
    depot_lon = depot['longitude']

    # Query active/pending pickups
    query = PickupRequest.query.filter(
        PickupRequest.status.in_(['ASSIGNED', 'ON_THE_WAY', 'CREATED'])
    )
    if collector_id:
        query = query.filter_by(collector_id=collector_id)

    unvisited = query.all()
    if not unvisited:
        return {
            'depot': depot,
            'ordered_stops': [],
            'total_distance_km': 0.0,
            'stop_count': 0,
            'high_priority_count': 0
        }

    # Separate high priority stops for sequence precedence
    high_priority = [p for p in unvisited if p.priority == 'HIGH']
    regular = [p for p in unvisited if p.priority != 'HIGH']

    ordered_stops = []
    total_dist = 0.0
    curr_lat = depot_lat
    curr_lon = depot_lon

    # Process stops group-by-group (High priority first, then regular)
    for group in [high_priority, regular]:
        remaining = list(group)
        while remaining:
            # Find nearest stop from current position
            nearest = min(
                remaining,
                key=lambda p: calculate_haversine(
                    curr_lat, curr_lon,
                    p.source.latitude if p.source else depot_lat,
                    p.source.longitude if p.source else depot_lon
                )
            )
            dist = calculate_haversine(
                curr_lat, curr_lon,
                nearest.source.latitude if nearest.source else depot_lat,
                nearest.source.longitude if nearest.source else depot_lon
            )
            total_dist += dist
            curr_lat = nearest.source.latitude if nearest.source else depot_lat
            curr_lon = nearest.source.longitude if nearest.source else depot_lon

            stop_data = nearest.to_dict()
            stop_data['segment_distance_km'] = dist
            stop_data['stop_sequence'] = len(ordered_stops) + 1
            ordered_stops.append(stop_data)
            remaining.remove(nearest)

    # Return leg back to depot
    return_dist = calculate_haversine(curr_lat, curr_lon, depot_lat, depot_lon)
    total_dist += return_dist

    return {
        'depot': depot,
        'ordered_stops': ordered_stops,
        'total_distance_km': round(total_dist, 2),
        'stop_count': len(ordered_stops),
        'high_priority_count': len(high_priority)
    }
