"""
WasteLoop Logic Verification Test Suite
Validates explainable priority calculations, overflow predictions, recovery rates,
earnings formulas, and strict state transition rules.
"""
from services.priority_service import calculate_priority_score
from services.overflow_service import calculate_overflow_prediction
from services.recovery_service import calculate_recovery_rates
from services.earnings_service import calculate_collector_earnings
from services.circularity_service import compute_circularity_score
from utils.validators import validate_status_transition, validate_collection_quantities, validate_email

def run_tests():
    print("[TEST] Running WasteLoop Business Logic Tests...\n")

    # 1. Explainable AI Priority Engine Test
    p_high = calculate_priority_score(fill_pct=92.0, weight_kg=300.0, waiting_hours=8.0, overflow_risk='HIGH')
    print(f"1. Priority Engine (92% fill, 8h wait): Priority={p_high['priority']}, Score={p_high['score']}")
    print(f"   Reason: \"{p_high['reason']}\"")
    assert p_high['priority'] == 'HIGH', "Expected HIGH priority for 92% fill"
    assert "92" in p_high['reason'], "Expected 92% in explainable reason"

    p_low = calculate_priority_score(fill_pct=20.0, weight_kg=40.0, waiting_hours=0.5, overflow_risk='LOW')
    print(f"   Priority Engine (20% fill): Priority={p_low['priority']}, Score={p_low['score']}")
    assert p_low['priority'] == 'LOW', "Expected LOW priority for low fill"

    # 2. Smart Bin Overflow Engine Test
    overflow = calculate_overflow_prediction(current_fill=92.0, fill_rate=4.0)
    print(f"\n2. Overflow Engine (92% fill, 4.0%/hr rate): {overflow['hours_to_overflow']} hours, Risk={overflow['risk_level']}")
    assert overflow['hours_to_overflow'] == 2.0, f"Expected 2.0 hours, got {overflow['hours_to_overflow']}"
    assert overflow['risk_level'] == 'HIGH', "Expected HIGH risk for 2-hour overflow"

    # 3. Recovery Service Test (and safe zero division)
    rec = calculate_recovery_rates(collected_kg=100.0, recyclable_kg=75.0, recovered_kg=70.0, disposed_kg=25.0)
    print(f"\n3. Recovery Rates: Recovery={rec['recovery_rate']}%, Recycling={rec['recycling_rate']}%, Diversion={rec['diversion_rate']}%")
    assert rec['recovery_rate'] == 70.0
    assert rec['recycling_rate'] == 75.0

    rec_zero = calculate_recovery_rates(0.0, 0.0, 0.0, 0.0)
    assert rec_zero['recovery_rate'] == 0.0, "Expected safe 0.0 on zero division"

    # 4. Circularity Score Test
    circ = compute_circularity_score(rec['recovery_rate'], rec['recycling_rate'], rec['diversion_rate'])
    print(f"\n4. Circularity Score: {circ['score']}/100, Tier='{circ['tier']}'")
    assert circ['score'] > 0

    # 5. Earnings Calculation Formula Test
    # Base 30 + Distance 10 (dist > 3) + Priority 15 (HIGH) + Weight 10 (50kg / 5 = 10) = 65.0
    earnings = calculate_collector_earnings(weight_kg=50.0, priority='HIGH', distance_km=4.5)
    print(f"\n5. Estimated Earnings: Base=${earnings['base_amount']}, Dist=${earnings['distance_bonus']}, Priority=${earnings['priority_bonus']}, Weight=${earnings['weight_bonus']} -> Total=${earnings['total_amount']}")
    assert earnings['total_amount'] == 65.0, f"Expected $65.00, got ${earnings['total_amount']}"

    # 6. Strict Status Transition State Machine Test
    valid1, _ = validate_status_transition('CREATED', 'ASSIGNED')
    assert valid1, "Expected CREATED -> ASSIGNED to be valid"

    valid2, _ = validate_status_transition('ASSIGNED', 'ON_THE_WAY')
    assert valid2, "Expected ASSIGNED -> ON_THE_WAY to be valid"

    valid3, _ = validate_status_transition('ON_THE_WAY', 'COLLECTED')
    assert valid3, "Expected ON_THE_WAY -> COLLECTED to be valid"

    invalid_jump, msg = validate_status_transition('CREATED', 'COLLECTED')
    print(f"\n6. Invalid Status Jump Check (CREATED -> COLLECTED): Allowed={invalid_jump}, Message='{msg}'")
    assert not invalid_jump, "Arbitrary state jump must be rejected"

    # 7. Collection Quantities Validation Test
    q_valid, _ = validate_collection_quantities(collected=100.0, recyclable=50.0, recovered=30.0, disposed=15.0)
    assert q_valid, "Sum 95kg <= 100kg should be valid"

    q_invalid, q_msg = validate_collection_quantities(collected=50.0, recyclable=40.0, recovered=30.0, disposed=10.0)
    print(f"\n7. Excess Quantities Check (Sum 80kg > 50kg): Valid={q_valid}, Message='{q_msg}'")
    assert not q_invalid, "Excess segregated quantities must be rejected"

    print("\n[SUCCESS] ALL 7 BUSINESS LOGIC TEST SUITES PASSED FLAWLESSLY!")

if __name__ == '__main__':
    run_tests()
