"""
Recovery Calculation Service
Computes recovery, recycling, and landfill diversion rates.
"""

def calculate_recovery_rates(
    collected_kg: float,
    recyclable_kg: float,
    recovered_kg: float,
    disposed_kg: float = 0.0
) -> dict:
    """
    Formulas:
    Recovery Rate = (recovered / collected) * 100
    Recycling Rate = (recyclable / collected) * 100
    Diversion Rate = ((recovered + recyclable) / collected) * 100
    Safely handles division by zero.
    """
    if collected_kg <= 0.0:
        return {
            'recovery_rate': 0.0,
            'recycling_rate': 0.0,
            'diversion_rate': 0.0
        }

    rec_rate = min(100.0, (recovered_kg / collected_kg) * 100.0)
    recyc_rate = min(100.0, (recyclable_kg / collected_kg) * 100.0)
    div_rate = min(100.0, ((recovered_kg + recyclable_kg) / collected_kg) * 100.0)

    return {
        'recovery_rate': round(rec_rate, 2),
        'recycling_rate': round(recyc_rate, 2),
        'diversion_rate': round(div_rate, 2)
    }
