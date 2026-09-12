"""
WasteLoop Application Entry Point
Flask factory, blueprint registration, error handlers, and CORS setup.
"""
import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from extensions import db
from routes import register_blueprints

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)
logger = logging.getLogger('wasteloop')

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)

    # Configure CORS — allow Vite dev server to call the Flask API with session cookies
    CORS(
        app,
        supports_credentials=True,
        resources={r"/api/*": {"origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]}}
    )

    # Register all application blueprints
    register_blueprints(app)

    # Health check endpoint
    @app.route('/', methods=['GET'])
    @app.route('/api/health', methods=['GET'])
    def health_check():
        db_type = 'PostgreSQL' if 'postgresql' in app.config.get('SQLALCHEMY_DATABASE_URI', '') else 'MySQL 8.0'
        return jsonify({
            'status': 'healthy',
            'platform': 'WasteLoop Backend Engine',
            'database': db_type,
            'version': '1.0.0'
        }), 200

    # ── Global Error Handlers (Never expose stack traces) ──
    @app.errorhandler(400)
    def bad_request_error(e):
        return jsonify({'success': False, 'message': 'Bad Request', 'error': 'BAD_REQUEST'}), 400

    @app.errorhandler(401)
    def unauthorized_error(e):
        return jsonify({'success': False, 'message': 'Unauthorized. Please sign in.', 'error': 'UNAUTHORIZED'}), 401

    @app.errorhandler(403)
    def forbidden_error(e):
        return jsonify({'success': False, 'message': 'Forbidden. You do not have permission for this resource.', 'error': 'FORBIDDEN'}), 403

    @app.errorhandler(404)
    def not_found_error(e):
        return jsonify({'success': False, 'message': 'The requested resource was not found.', 'error': 'NOT_FOUND'}), 404

    @app.errorhandler(409)
    def conflict_error(e):
        return jsonify({'success': False, 'message': 'Resource conflict.', 'error': 'CONFLICT'}), 409

    @app.errorhandler(422)
    def unprocessable_entity_error(e):
        return jsonify({'success': False, 'message': 'Unprocessable entity. Validation failed.', 'error': 'VALIDATION_ERROR'}), 422

    @app.errorhandler(500)
    def internal_server_error(e):
        logger.error(f"Internal Server Error: {str(e)}")
        return jsonify({'success': False, 'message': 'An internal server error occurred.', 'error': 'INTERNAL_SERVER_ERROR'}), 500

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
