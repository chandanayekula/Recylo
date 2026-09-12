"""
Routes Package
Registers all modular Blueprints into the Flask application instance.
"""
from flask import Flask
from routes.auth_routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.source_routes import source_bp
from routes.pickup_routes import pickup_bp
from routes.collector_routes import collector_bp
from routes.vehicle_routes import vehicle_bp
from routes.bin_routes import bin_bp
from routes.recovery_routes import recovery_bp
from routes.map_routes import map_bp
from routes.journey_routes import journey_bp

def register_blueprints(app: Flask):
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(source_bp)
    app.register_blueprint(pickup_bp)
    app.register_blueprint(collector_bp)
    app.register_blueprint(vehicle_bp)
    app.register_blueprint(bin_bp)
    app.register_blueprint(recovery_bp)
    app.register_blueprint(map_bp)
    app.register_blueprint(journey_bp)
