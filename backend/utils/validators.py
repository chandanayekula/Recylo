"""
Input Validation & Strict State Machine Rules
Validates payloads, numbers, constraints, and pickup lifecycle transitions.
"""
import re

VALID_PICKUP_STATUSES = [
    'CREATED',
    'ASSIGNED',
    'ON_THE_WAY',
    'COLLECTED',
    'SEGREGATED',
    'RECOVERED',
    'RECYCLED',
    'DISPOSED',
    'CANCELLED'
]

# Strict directed state transitions
ALLOWED_TRANSITIONS = {
    'CREATED': ['ASSIGNED', 'CANCELLED'],
    'ASSIGNED': ['ON_THE_WAY', 'CREATED', 'CANCELLED'],
    'ON_THE_WAY': ['COLLECTED', 'CANCELLED'],
    'COLLECTED': ['SEGREGATED', 'RECOVERED'],
    'SEGREGATED': ['RECOVERED', 'RECYCLED', 'DISPOSED'],
    'RECOVERED': ['RECYCLED', 'DISPOSED'],
    'RECYCLED': ['DISPOSED'],
    'DISPOSED': [],
    'CANCELLED': []
}

def validate_email(email: str) -> bool:
    if not email or not isinstance(email, str):
        return False
    pattern = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    return bool(re.match(pattern, email.strip()))

def validate_status_transition(current_status: str, target_status: str) -> tuple[bool, str]:
    curr = current_status.upper()
    target = target_status.upper()

    if target not in VALID_PICKUP_STATUSES:
        return False, f"Invalid target status '{target}'."

    if curr == target:
        return True, "Status unchanged."

    allowed = ALLOWED_TRANSITIONS.get(curr, [])
    if target in allowed:
        return True, "Valid transition."

    return False, f"Illegal status jump from '{curr}' to '{target}'. Allowed next states: {', '.join(allowed) or 'None (Terminal state)'}."

def validate_collection_quantities(collected: float, recyclable: float, recovered: float, disposed: float) -> tuple[bool, str]:
    if collected <= 0:
        return False, "Collected quantity must be greater than 0 kg."
    if recyclable < 0 or recovered < 0 or disposed < 0:
        return False, "Recyclable, recovered, and disposed quantities cannot be negative."

    segregated_sum = recyclable + recovered + disposed
    # Allow tiny float precision tolerance
    if segregated_sum > collected + 0.001:
        return False, f"Sum of segregated parts ({round(segregated_sum, 2)} kg) cannot exceed total collected quantity ({round(collected, 2)} kg)."

    return True, "Quantities valid."
