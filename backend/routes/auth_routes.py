"""
Authentication Route Endpoints
Handles login, registration, session retrieval, and logout.
"""
from flask import Blueprint, request
from services.auth_service import authenticate_user, logout_user, get_current_user, register_user
from utils.responses import success_response, error_response
from utils.permissions import login_required

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'GENERATOR').strip().upper()
    phone = data.get('phone', '').strip()

    if not name or not email or not password:
        return error_response(message="Name, email, and password are required.", error="VALIDATION_ERROR", status_code=422)

    if role not in ('ADMIN', 'COLLECTOR', 'GENERATOR'):
        return error_response(message="Invalid role. Must be ADMIN, COLLECTOR, or GENERATOR.", error="VALIDATION_ERROR", status_code=422)

    user_dict, err = register_user(name=name, email=email, password=password, role=role, phone=phone)
    if err:
        return error_response(message=err, error="REGISTRATION_ERROR", status_code=409)

    return success_response(data=user_dict, message=f"Account created successfully. Welcome, {user_dict['name']}!")

@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')

    user_dict, err = authenticate_user(email, password)
    if err:
        return error_response(message=err, error="INVALID_CREDENTIALS", status_code=401)

    return success_response(
        data=user_dict,
        message=f"Welcome back, {user_dict['name']}. Signed in as {user_dict['role']}."
    )

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    logout_user()
    return success_response(message="Successfully signed out.")

@auth_bp.route('/api/me', methods=['GET'])
@login_required
def get_current_profile():
    user = get_current_user()
    if not user:
        return error_response(message="Session expired.", error="UNAUTHORIZED", status_code=401)
    return success_response(data=user.to_dict())
