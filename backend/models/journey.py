"""
JourneyEvent Model
Immutable chain-of-custody audit trail for every pickup request.
"""
from datetime import datetime
from extensions import db

class JourneyEvent(db.Model):
    __tablename__ = 'journey_events'

    id = db.Column(db.Integer, primary_key=True)
    pickup_id = db.Column(db.Integer, db.ForeignKey('pickup_requests.id', ondelete='CASCADE'), nullable=False, index=True)

    stage = db.Column(db.String(80), nullable=False) # e.g. CREATED, ASSIGNED, ON_THE_WAY, COLLECTED, MRF_PROCESSED, RECYCLED
    status = db.Column(db.String(50), default='COMPLETED') # COMPLETED, ACTIVE, PENDING
    location = db.Column(db.String(180), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            'id': self.id,
            'pickup_id': self.pickup_id,
            'stage': self.stage,
            'status': self.status,
            'location': self.location,
            'notes': self.notes,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'time': self.timestamp.strftime('%b %d, %I:%M %p') if self.timestamp else None
        }
