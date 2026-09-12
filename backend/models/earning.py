"""
CollectorEarning Model
Calculated internal earnings for collectors per completed pickup.
"""
from datetime import datetime
from extensions import db

class CollectorEarning(db.Model):
    __tablename__ = 'collector_earnings'

    id = db.Column(db.Integer, primary_key=True)
    collector_id = db.Column(db.Integer, db.ForeignKey('collectors.id', ondelete='CASCADE'), nullable=False, index=True)
    pickup_id = db.Column(db.Integer, db.ForeignKey('pickup_requests.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)

    base_amount = db.Column(db.Float, default=30.0)
    distance_bonus = db.Column(db.Float, default=0.0)
    priority_bonus = db.Column(db.Float, default=0.0)
    weight_bonus = db.Column(db.Float, default=0.0)
    total_amount = db.Column(db.Float, nullable=False, default=30.0)

    status = db.Column(db.String(30), default='PENDING', nullable=False) # PENDING, PAID
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'collector_id': self.collector_id,
            'pickup_id': self.pickup.pickup_code if self.pickup else self.pickup_id,
            'base_amount': round(self.base_amount, 2),
            'distance_bonus': round(self.distance_bonus, 2),
            'priority_bonus': round(self.priority_bonus, 2),
            'weight_bonus': round(self.weight_bonus, 2),
            'total_amount': round(self.total_amount, 2),
            'payout_str': f"${self.total_amount:.2f}",
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'date': self.created_at.strftime('%b %d, %Y') if self.created_at else None
        }
