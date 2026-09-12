"""
Explainable Rule-Based AI-Style Priority Engine
Computes transparent, auditable priority scores based on operational factors.
"""

def calculate_priority_score(
    fill_pct: float = 50.0,
    weight_kg: float = 100.0,
    waste_type: str = 'General',
    waiting_hours: float = 1.0,
    overflow_risk: str = 'LOW',
    existing_priority: str = None
) -> dict:
    """
    Explainable rule-based scoring engine:
    - Fill Component: 40% (0-100 scaled from fill_pct)
    - Quantity Component: 25% (0-100 scaled against 500kg nominal baseline)
    - Waiting Time Component: 20% (0-100 scaled against 24-hour SLA window)
    - Risk Component: 15% (HIGH = 100, MEDIUM = 50, LOW = 15)

    Score mapping:
    - 70 to 100: HIGH
    - 40 to 69:  MEDIUM
    - 0 to 39:   LOW
    """
    # 1. Fill Component (40%)
    fill_score = min(100.0, max(0.0, float(fill_pct))) * 0.40

    # 2. Quantity Component (25%)
    # Cap scaling at 500 kg for maximum quantity points
    normalized_qty = min(100.0, (float(weight_kg) / 500.0) * 100.0)
    qty_score = normalized_qty * 0.25

    # 3. Waiting Component (20%)
    # Scaled to 24-hour standard collection SLA
    normalized_wait = min(100.0, (float(waiting_hours) / 24.0) * 100.0)
    wait_score = normalized_wait * 0.20

    # 4. Overflow Risk Component (15%)
    risk_tier = (overflow_risk or 'LOW').upper()
    if risk_tier == 'HIGH' or fill_pct >= 90:
        risk_raw = 100.0
    elif risk_tier == 'MEDIUM' or fill_pct >= 70:
        risk_raw = 55.0
    else:
        risk_raw = 15.0
    risk_score = risk_raw * 0.15

    # Total Score
    total_score = round(fill_score + qty_score + wait_score + risk_score, 1)

    # Waste type multiplier adjustments
    waste_norm = (waste_type or '').lower()
    if 'organic' in waste_norm or 'food' in waste_norm:
        # Perishability urgency
        total_score = min(100.0, total_score + 5.0)

    # Determine Priority Classification
    if total_score >= 70.0 or fill_pct >= 90.0:
        priority = 'HIGH'
    elif total_score >= 40.0:
        priority = 'MEDIUM'
    else:
        priority = 'LOW'

    # Build human-readable explainable reason
    reasons = []
    if fill_pct >= 90:
        reasons.append(f"smart bin is at critical capacity ({fill_pct}%)")
    elif fill_pct >= 70:
        reasons.append(f"smart bin fill is elevated ({fill_pct}%)")

    if waiting_hours >= 6:
        reasons.append(f"request has been queued for {int(waiting_hours)} hours")

    if weight_kg >= 250:
        reasons.append(f"high mass payload ({weight_kg} kg)")

    if risk_tier == 'HIGH':
        reasons.append("rapid overflow trend flagged by telemetry")

    if not reasons:
        reasons.append("standard operational scheduling parameters")

    reason_str = f"{priority} priority because " + ", and ".join(reasons) + "."

    return {
        'score': total_score,
        'priority': priority,
        'reason': reason_str
    }
