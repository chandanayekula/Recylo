"""
Waste Source Route Endpoints
CRUD operations for waste generating facilities and partner organizations.
"""
from flask import Blueprint, request
from extensions import db
from models import WasteSource, User
from utils.responses import success_response, error_response
from utils.permissions import login_required, get_current_user_id, get_current_user_role

source_bp = Blueprint('source_bp', __name__)

@source_bp.route('/api/sources', methods=['GET'])
def get_sources():
    user_id = get_current_user_id()
    user_role = get_current_user_role()

    # Role filtering
    if user_role == 'GENERATOR' and user_id:
        sources = WasteSource.query.filter_by(user_id=user_id).order_by(WasteSource.created_at.desc()).all()
    else:
        sources = WasteSource.query.order_by(WasteSource.created_at.desc()).all()

    return success_response(data=[s.to_dict() for s in sources])

@source_bp.route('/api/sources', methods=['POST'])
@login_required
def create_source():
    data = request.get_json() or {}
    name = data.get('name')
    category = data.get('category', 'Commercial')
    address = data.get('address')
    latitude = float(data.get('latitude', 37.7749))
    longitude = float(data.get('longitude', -122.4194))
    contact_phone = data.get('contact_phone')
    monthly_volume = float(data.get('monthly_volume_kg', 1000.0))

    if not name or not address:
        return error_response(message="Name and address are required.", error="VALIDATION_ERROR", status_code=422)

    user_id = get_current_user_id()

    source = WasteSource(
        user_id=user_id,
        name=name.strip(),
        category=category.strip(),
        address=address.strip(),
        latitude=latitude,
        longitude=longitude,
        contact_phone=contact_phone,
        monthly_volume_kg=monthly_volume,
        segregation_score=92.0
    )
    db.session.add(source)
    db.session.commit()

    return success_response(data=source.to_dict(), message="Waste source registered successfully.", status_code=201)
