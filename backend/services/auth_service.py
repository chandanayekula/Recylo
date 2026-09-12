"""
Authentication Service
Session management, credential verification, and new user registration.
"""
from flask import session
from models import User
from extensions import db

def authenticate_user(email: str, password: str) -> tuple[dict, str]:
    if not email or not password:
        return None, "Email and password are required."

    user = User.query.filter_by(email=email.strip().lower()).first()
    if not user:
        return None, "Invalid email or password."

    if not user.is_active:
        return None, "Account has been deactivated. Please contact an administrator."

    if not user.check_password(password):
        return None, "Invalid email or password."

    # Store in server-side session
    session['user_id'] = user.id
    session['role'] = user.role.upper()
    session['name'] = user.name
    session['email'] = user.email

    return user.to_dict(), None


def register_user(name: str, email: str, password: str, role: str = 'GENERATOR', phone: str = '') -> tuple[dict, str]:
    """Create a new user account, log them in, and return their profile dict."""
    if not name or not email or not password:
        return None, "Name, email, and password are required."

    if len(password) < 6:
        return None, "Password must be at least 6 characters long."

    email = email.strip().lower()
    existing = User.query.filter_by(email=email).first()
    if existing:
        return None, "An account with this email already exists."

    user = User(
        name=name.strip(),
        email=email,
        role=role.upper(),
        phone=phone or None
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Auto login after registration
    session['user_id'] = user.id
    session['role'] = user.role.upper()
    session['name'] = user.name
    session['email'] = user.email

    return user.to_dict(), None


def logout_user():
    session.clear()


def get_current_user() -> User:
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)
