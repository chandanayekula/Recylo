"""
Authentication & Role-Checking Permissions
Enforces role boundaries: ADMIN, GENERATOR, COLLECTOR.
"""
from functools import wraps
from flask import session
from utils.responses import error_response

def get_current_user_id():
    return session.get('user_id')

def get_current_user_role():
    role = session.get('role')
    return role.upper() if role else None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('user_id'):
            return error_response(message="Authentication required. Please sign in.", error="UNAUTHORIZED", status_code=401)
        return f(*args, **kwargs)
    return decorated_function

def roles_required(*allowed_roles):
    allowed = [r.upper() for r in allowed_roles]
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not session.get('user_id'):
                return error_response(message="Authentication required. Please sign in.", error="UNAUTHORIZED", status_code=401)
            user_role = (session.get('role') or '').upper()
            if user_role not in allowed:
                return error_response(message="Access denied. Insufficient permissions for this action.", error="FORBIDDEN", status_code=403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
