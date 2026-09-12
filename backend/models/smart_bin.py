"""
SmartBin Model
IoT telemetry sensor data for municipal smart waste containers.
"""
from datetime import datetime
from extensions import db

class SmartBin(db.Model):
    __tablename__ = 'smart_bins'

    id = db.Column(db.Integer, primary_key=True)
    bin_code = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. BIN-001, B-104
    location_name = db.Column(db.String(150), nullable=False)
    zone = db.Column(db.String(80), nullable=False, default='Sector 1')
    waste_type = db.Column(db.String(80), nullable=False, default='Plastics')

    current_fill_pct = db.Column(db.Float, nullable=False, default=0.0)
    previous_fill_pct = db.Column(db.Float, default=0.0)
    fill_rate_per_hour = db.Column(db.Float, default=1.5) # % increase per hour

    latitude = db.Column(db.Float, nullable=False, default=37.7749)
    longitude = db.Column(db.Float, nullable=False, default=-122.4194)

    last_emptied_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        # Calculate overflow metrics
        remaining_capacity = max(0.0, 100.0 - self.current_fill_pct)
        if self.fill_rate_per_hour > 0:
            hours_to_overflow = round(remaining_capacity / self.fill_rate_per_hour, 1)
            overflow_trend = f"{hours_to_overflow} hours"
            is_high_risk = hours_to_overflow < 6.0
        else:
            hours_to_overflow = None
            overflow_trend = "No current overflow trend"
            is_high_risk = False

        status = 'critical' if self.current_fill_pct >= 90 else ('warning' if self.current_fill_pct >= 70 else 'normal')

        return {
            'id': self.bin_code,
            'db_id': self.id,
            'bin_code': self.bin_code,
            'location': self.location_name,
            'zone': self.zone,
            'waste_type': self.waste_type,
            'fill_pct': round(self.current_fill_pct, 1),
            'previous_fill_pct': round(self.previous_fill_pct, 1),
            'fill_rate_per_hour': round(self.fill_rate_per_hour, 2),
            'hours_to_overflow': hours_to_overflow,
            'overflow_trend': overflow_trend,
            'overflow_risk': 'HIGH' if is_high_risk or self.current_fill_pct >= 90 else 'LOW',
            'status': status,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'lat': self.latitude,
            'lng': self.longitude,
            'last_emptied': self.last_emptied_at.strftime('%Y-%m-%d %H:%M') if self.last_emptied_at else 'Recent',
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }
