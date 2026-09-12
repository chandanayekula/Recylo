"""
Collector Earnings Service
Calculates estimated internal collector remuneration and bonuses per completed pickup.
"""

def calculate_collector_earnings(
    weight_kg: float,
    priority: str = 'MEDIUM',
    distance_km: float = 2.0
) -> dict:
    """
    Estimated WasteLoop Earnings formula:
    - Base compensation: $30.00
    - Distance bonus: $10.00 when distance > 3.0 km
    - High priority bonus: $15.00 when priority is HIGH
    - Weight bonus: $1.00 per 5 kg collected
    """
    base = 30.0
    dist_bonus = 10.0 if distance_km > 3.0 else 0.0
    pri_bonus = 15.0 if (priority or '').upper() == 'HIGH' else 0.0
    weight_bonus = round(max(0.0, (float(weight_kg) / 5.0) * 1.0), 2)

    total = round(base + dist_bonus + pri_bonus + weight_bonus, 2)

    return {
        'label': 'Estimated WasteLoop Earnings',
        'base_amount': base,
        'distance_bonus': dist_bonus,
        'priority_bonus': pri_bonus,
        'weight_bonus': weight_bonus,
        'total_amount': total,
        'currency': 'USD'
    }
