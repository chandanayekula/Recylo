"""
Vehicle Model
Fleet units: electric vans, compactor trucks, cargo autos.
"""
from datetime import datetime
from extensions import db

class Vehicle(db.Model):
    __tablename__ = 'vehicles'

    id = db.Column(db.Integer, primary_key=True)
    vehicle_number = db.Column(db.String(50), unique=True, nullable=False, index=True) # e.g. TRUCK-03, V-01
    vehicle_type = db.Column(db.String(80), nullable=False, default='Electric Van')     # Compactor Truck, Electric Van, Cargo Trike
    capacity_kg = db.Column(db.Float, nullable=False, default=1200.0)
    current_load_kg = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(30), default='AVAILABLE', nullable=False)              # AVAILABLE, IN_USE, OFFLINE
    assigned_collector_name = db.Column(db.String(120), nullable=True)
    battery_fuel = db.Column(db.String(50), default='92% (EV)')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    pickups = db.relationship('PickupRequest', backref='vehicle', lazy=True)

    def to_dict(self):
        return {
            'id': self.vehicle_number,
            'db_id': self.id,
            'vehicle_id': self.vehicle_number,
            'vehicle_number': self.vehicle_number,
            'type': self.vehicle_type,
            'capacity_kg': self.capacity_kg,
            'current_load_kg': self.current_load_kg,
            'status': self.status.lower(),
            'assigned_to': self.assigned_collector_name or 'Unassigned',
            'assigned_collector': self.assigned_collector_name or 'Unassigned',
            'battery_fuel': self.battery_fuel,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
