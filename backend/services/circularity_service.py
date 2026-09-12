"""
Circularity Service
Computes internal WasteLoop Circularity Score (0-100) based on weighted recycling indices.
"""

def compute_circularity_score(recovery_rate: float, recycling_rate: float, diversion_rate: float) -> dict:
    """
    Calculates internal platform circularity performance:
    - Recovery Weight:  45%
    - Recycling Weight: 35%
    - Diversion Weight: 20%
    Note: This is an internal WasteLoop operational score, not an official ISO/environmental standard.
    """
    rec_r = min(100.0, max(0.0, float(recovery_rate)))
    recyc_r = min(100.0, max(0.0, float(recycling_rate)))
    div_r = min(100.0, max(0.0, float(diversion_rate)))

    weighted_score = (rec_r * 0.45) + (recyc_r * 0.35) + (div_r * 0.20)
    final_score = round(min(100.0, max(0.0, weighted_score)), 1)

    return {
        'score': final_score,
        'recovery_rate': rec_r,
        'recycling_rate': recyc_r,
        'diversion_rate': div_r,
        'tier': 'Tier 1 Circular Leader' if final_score >= 80 else ('Tier 2 Active Circularity' if final_score >= 60 else 'Standard Processing')
    }
