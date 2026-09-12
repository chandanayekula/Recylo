"""
Models Package
Exports all SQLAlchemy models for the WasteLoop platform.
"""
from models.user import User
from models.waste_source import WasteSource
from models.collector import Collector
from models.availability import CollectorAvailability
from models.vehicle import Vehicle
from models.pickup import PickupRequest
from models.smart_bin import SmartBin
from models.recovery import RecoveryRecord
from models.journey import JourneyEvent
from models.earning import CollectorEarning

__all__ = [
    'User',
    'WasteSource',
    'Collector',
    'CollectorAvailability',
    'Vehicle',
    'PickupRequest',
    'SmartBin',
    'RecoveryRecord',
    'JourneyEvent',
    'CollectorEarning',
]
