"""
RecoveryRecord Model
Material reclamation outcomes and purity verification records.
"""
from datetime import datetime
from extensions import db

class RecoveryRecord(db.Model):
    __tablename__ = 'recovery_records'

    id = db.Column(db.Integer, primary_key=True)
    pickup_id = db.Column(db.Integer, db.ForeignKey('pickup_requests.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)

    collected_quantity_kg = db.Column(db.Float, nullable=False, default=0.0)
    recyclable_quantity_kg = db.Column(db.Float, nullable=False, default=0.0)
    recovered_quantity_kg = db.Column(db.Float, nullable=False, default=0.0)
    disposed_quantity_kg = db.Column(db.Float, nullable=False, default=0.0)

    recovery_rate = db.Column(db.Float, default=0.0)   # recovered / collected * 100
    recycling_rate = db.Column(db.Float, default=0.0)  # recyclable / collected * 100
    diversion_rate = db.Column(db.Float, default=0.0)  # (recovered + recyclable) / collected * 100

    facility_name = db.Column(db.String(150), default='EcoLoop Central Recovery Hub')
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'pickup_id': self.pickup.pickup_code if self.pickup else self.pickup_id,
            'collected_quantity_kg': round(self.collected_quantity_kg, 2),
            'recyclable_quantity_kg': round(self.recyclable_quantity_kg, 2),
            'recovered_quantity_kg': round(self.recovered_quantity_kg, 2),
            'disposed_quantity_kg': round(self.disposed_quantity_kg, 2),
            'recovery_rate': round(self.recovery_rate, 1),
            'recycling_rate': round(self.recycling_rate, 1),
            'diversion_rate': round(self.diversion_rate, 1),
            'facility_name': self.facility_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
