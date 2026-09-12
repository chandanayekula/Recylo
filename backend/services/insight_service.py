"""
AI-Style Dynamic Insights Service
Generates live, data-driven operational intelligence statements from real database state.
"""
from models import SmartBin, PickupRequest, Collector, RecoveryRecord
from sqlalchemy import func
from extensions import db

def generate_live_insights() -> list[dict]:
    """
    Analyzes current database state to generate dynamic, human-readable actionable insights.
    Never uses static hardcoded numbers.
    """
    insights = []

    # 1. Overflow Prediction Insights
    bins = SmartBin.query.all()
    overflowing_soon = []
    highest_bin = None

    for b in bins:
        rem = max(0.0, 100.0 - b.current_fill_pct)
        if b.fill_rate_per_hour > 0:
            hrs = rem / b.fill_rate_per_hour
            if hrs < 6.0 or b.current_fill_pct >= 90.0:
                overflowing_soon.append(b)

        if not highest_bin or b.current_fill_pct > highest_bin.current_fill_pct:
            highest_bin = b

    if overflowing_soon:
        count = len(overflowing_soon)
        bin_names = ", ".join([b.bin_code for b in overflowing_soon[:2]])
        insights.append({
            'id': 'INS-OVERFLOW',
            'type': 'overflow_risk',
            'urgency': 'critical',
            'title': 'Critical Bin Overflow Alert',
            'text': f"{count} smart {'bin is' if count == 1 else 'bins are'} predicted to overflow within 6 hours ({bin_names}). Immediate dispatch recommended.",
            'recommended_action': f"Schedule priority route for {overflowing_soon[0].bin_code}"
        })
    elif highest_bin:
        insights.append({
            'id': 'INS-BIN-STATUS',
            'type': 'status',
            'urgency': 'info',
            'title': 'Highest Fill Level Monitored',
            'text': f"Smart Bin {highest_bin.bin_code} at {highest_bin.location_name} is currently at {highest_bin.current_fill_pct:.1f}% capacity.",
            'recommended_action': 'Continue standard telemetry polling'
        })

    # 2. Material Stream Dominance Insights
    stream_stats = db.session.query(
        PickupRequest.waste_type,
        func.sum(PickupRequest.estimated_weight_kg)
    ).filter(PickupRequest.status != 'CANCELLED').group_by(PickupRequest.waste_type).all()

    total_weight = sum([s[1] or 0.0 for s in stream_stats])
    if stream_stats and total_weight > 0:
        top_stream = max(stream_stats, key=lambda s: s[1] or 0.0)
        pct = round(((top_stream[1] or 0.0) / total_weight) * 100.0, 1)
        insights.append({
            'id': 'INS-STREAM',
            'type': 'composition',
            'urgency': 'positive',
            'title': 'Dominant Waste Stream Identified',
            'text': f"{top_stream[0]} represents {pct}% ({int(top_stream[1])} kg) of all scheduled and collected volume.",
            'recommended_action': 'Ensure specialized processing capacity at destination MRF'
        })

    # 3. Collector Availability Insights
    available_cols = Collector.query.filter_by(is_active=True, duty_status='AVAILABLE').count()
    total_active_pickups = PickupRequest.query.filter(
        PickupRequest.status.in_(['CREATED', 'ASSIGNED', 'ON_THE_WAY'])
    ).count()

    insights.append({
        'id': 'INS-COLLECTOR',
        'type': 'logistics',
        'urgency': 'normal' if available_cols > 0 else 'warning',
        'title': 'Fleet Duty Capacity',
        'text': f"{available_cols} {'collector is' if available_cols == 1 else 'collectors are'} currently available for dispatch across {total_active_pickups} active pickup orders.",
        'recommended_action': 'Dispatch next pending queue items' if available_cols > 0 else 'Broadcast incentive bonus for peak shifts'
    })

    # 4. Critical Pickup Prioritization Insight
    critical_pickup = PickupRequest.query.filter_by(priority='HIGH', status='CREATED').first()
    if critical_pickup:
        insights.append({
            'id': 'INS-PRIORITY-TASK',
            'type': 'priority_action',
            'urgency': 'critical',
            'title': 'High-Priority Dispatch Required',
            'text': f"Pickup #{critical_pickup.pickup_code} at {critical_pickup.source.name if critical_pickup.source else 'facility'} has High priority: {critical_pickup.priority_reason or 'Critical volume queue'}.",
            'recommended_action': f"Assign available carrier to #{critical_pickup.pickup_code}"
        })

    return insights
