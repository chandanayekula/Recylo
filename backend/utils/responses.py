"""
Standardized JSON Response Helpers
Formats all API responses in consistent structure.
"""
from flask import jsonify

def success_response(data=None, message="Success", status_code=200):
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    return jsonify(payload), status_code

def error_response(message="An error occurred", error="ERROR", status_code=400):
    payload = {
        "success": False,
        "message": message,
        "error": error
    }
    return jsonify(payload), status_code
