"""
WasteSource Model
Represents facilities or generators producing recyclable streams.
"""
from datetime import datetime
from extensions import db

class WasteSource(db.Model):
    __tablename__ = 'waste_sources'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(80), nullable=False, default='Commercial') # Commercial, Hospitality, Corporate, Residential
    address = db.Column(db.String(255), nullable=False)
    latitude = db.Column(db.Float, nullable=False, default=37.7749)
    longitude = db.Column(db.Float, nullable=False, default=-122.4194)
    contact_phone = db.Column(db.String(50), nullable=True)
    monthly_volume_kg = db.Column(db.Float, default=0.0)
    segregation_score = db.Column(db.Float, default=90.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    pickups = db.relationship('PickupRequest', backref='source', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'owner_name': self.owner.name if self.owner else None,
            'name': self.name,
            'category': self.category,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'contact_phone': self.contact_phone,
            'monthly_volume_kg': self.monthly_volume_kg,
            'segregation_score': self.segregation_score,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
