"""
CollectorAvailability Model
Flexible shift windows for part-time and full-time collectors.
"""
from datetime import datetime, date, time
from extensions import db

class CollectorAvailability(db.Model):
    __tablename__ = 'collector_availabilities'

    id = db.Column(db.Integer, primary_key=True)
    collector_id = db.Column(db.Integer, db.ForeignKey('collectors.id', ondelete='CASCADE'), nullable=False, index=True)
    day_date = db.Column(db.Date, nullable=False, default=date.today)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.String(30), default='AVAILABLE', nullable=False)  # AVAILABLE, BUSY, OFFLINE
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'collector_id': self.collector_id,
            'collector_name': self.collector.user.name if (self.collector and self.collector.user) else None,
            'date': self.day_date.isoformat() if self.day_date else None,
            'start_time': self.start_time.strftime('%H:%M') if self.start_time else None,
            'end_time': self.end_time.strftime('%H:%M') if self.end_time else None,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
