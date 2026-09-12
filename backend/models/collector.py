"""
Collector Model
Represents collection personnel, performance rating, and active workload.
"""
from datetime import datetime
from extensions import db

class Collector(db.Model):
    __tablename__ = 'collectors'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    phone = db.Column(db.String(50), nullable=True)
    rating = db.Column(db.Float, default=5.0)
    total_completed = db.Column(db.Integer, default=0)
    current_workload = db.Column(db.Integer, default=0)
    duty_status = db.Column(db.String(30), default='AVAILABLE')  # AVAILABLE, BUSY, OFFLINE
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    availabilities = db.relationship('CollectorAvailability', backref='collector', lazy=True, cascade="all, delete-orphan")
    pickups = db.relationship('PickupRequest', backref='collector', lazy=True)
    earnings = db.relationship('CollectorEarning', backref='collector', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.user.name if self.user else None,
            'email': self.user.email if self.user else None,
            'phone': self.phone or (self.user.phone if self.user else None),
            'rating': round(self.rating, 2),
            'total_completed': self.total_completed,
            'current_workload': self.current_workload,
            'duty_status': self.duty_status,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
