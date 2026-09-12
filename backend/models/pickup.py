"""
PickupRequest Model
Core transaction representing a waste collection order and lifecycle.
"""
from datetime import datetime
from extensions import db

class PickupRequest(db.Model):
    __tablename__ = 'pickup_requests'

    id = db.Column(db.Integer, primary_key=True)
    pickup_code = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. PK-1002
    source_id = db.Column(db.Integer, db.ForeignKey('waste_sources.id', ondelete='CASCADE'), nullable=False, index=True)
    collector_id = db.Column(db.Integer, db.ForeignKey('collectors.id', ondelete='SET NULL'), nullable=True, index=True)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id', ondelete='SET NULL'), nullable=True, index=True)

    waste_type = db.Column(db.String(100), nullable=False) # Plastics, Cardboard, Organics, E-Waste, Metals
    estimated_weight_kg = db.Column(db.Float, nullable=False)
    actual_weight_kg = db.Column(db.Float, nullable=True)

    priority = db.Column(db.String(20), default='MEDIUM', nullable=False) # LOW, MEDIUM, HIGH
    priority_score = db.Column(db.Float, default=50.0)
    priority_reason = db.Column(db.Text, nullable=True)

    status = db.Column(db.String(30), default='CREATED', nullable=False, index=True)
    # Statuses: CREATED, ASSIGNED, ON_THE_WAY, COLLECTED, SEGREGATED, RECOVERED, RECYCLED, DISPOSED, CANCELLED

    scheduled_time = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.Text, nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    recovery_record = db.relationship('RecoveryRecord', backref='pickup', uselist=False, lazy=True, cascade="all, delete-orphan")
    journey_events = db.relationship('JourneyEvent', backref='pickup', lazy=True, cascade="all, delete-orphan", order_by="JourneyEvent.timestamp.asc()")
    earning = db.relationship('CollectorEarning', backref='pickup', uselist=False, lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        collector_name = self.collector.user.name if (self.collector and self.collector.user) else 'Unassigned'
        vehicle_num = self.vehicle.vehicle_number if self.vehicle else None

        return {
            'id': self.pickup_code or f"PK-{self.id}",
            'db_id': self.id,
            'source_id': self.source_id,
            'source_name': self.source.name if self.source else 'Unknown Source',
            'address': self.source.address if self.source else '',
            'latitude': self.source.latitude if self.source else 37.7749,
            'longitude': self.source.longitude if self.source else -122.4194,
            'waste_type': self.waste_type,
            'estimated_weight_kg': self.estimated_weight_kg,
            'actual_weight_kg': self.actual_weight_kg,
            'priority': self.priority.lower(),
            'priority_score': self.priority_score,
            'priority_reason': self.priority_reason,
            'status': self.status.lower(),
            'collector_id': self.collector_id,
            'collector_name': collector_name,
            'vehicle_id': self.vehicle_id,
            'vehicle_number': vehicle_num,
            'scheduled_time': self.scheduled_time or 'Immediate',
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
