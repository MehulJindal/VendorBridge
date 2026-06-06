"""
Anomaly & Fraud Detection
---------------------------
Combines two approaches:

1. Rules-based checks (fast, interpretable):
   - Price spike: unit_price > 2× historical median for same item keyword
   - Zero-quantity or negative-price line items
   - Delivery days suspiciously low (< 1) or very high (> 365)
   - Math mismatch: total_price != quantity * unit_price (tolerance 1%)
   - Round-number manipulation: all line items exactly the same total

2. Isolation Forest (sklearn):
   - Trains on historical_quotations feature vectors if provided (≥5 samples)
   - Features: [total_amount, num_line_items, delivery_days, avg_unit_price]
   - Flags the incoming quotation as anomalous if score < threshold

Final risk_score = weighted blend of rules violations + IF score.
"""

import numpy as np
from typing import Optional
from models.schemas import (
    AnomalyRequest,
    AnomalyResponse,
    AnomalyFlag,
    QuotationLineItem,
)
from utils.logger import logger

# Try to import sklearn; gracefully degrade to rules-only if unavailable
try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not installed — running rules-only anomaly detection.")


# ── Rules-based checks ─────────────────────────────────────────────────────────

def _check_math_integrity(items: list[QuotationLineItem]) -> list[AnomalyFlag]:
    flags = []
    for i, item in enumerate(items):
        expected = round(item.quantity * item.unit_price, 2)
        if abs(expected - item.total_price) / max(abs(item.total_price), 1) > 0.01:
            flags.append(AnomalyFlag(
                flag_type="MATH_MISMATCH",
                severity="HIGH",
                description=(
                    f"Line item {i+1} '{item.description[:40]}': "
                    f"qty({item.quantity}) × price({item.unit_price}) = {expected}, "
                    f"but total_price = {item.total_price}"
                ),
                affected_field=f"line_items[{i}].total_price",
            ))
    return flags


def _check_zero_negative(items: list[QuotationLineItem]) -> list[AnomalyFlag]:
    flags = []
    for i, item in enumerate(items):
        if item.quantity <= 0:
            flags.append(AnomalyFlag(
                flag_type="ZERO_OR_NEGATIVE_QUANTITY",
                severity="HIGH",
                description=f"Line item {i+1} has quantity={item.quantity}.",
                affected_field=f"line_items[{i}].quantity",
            ))
        if item.unit_price < 0:
            flags.append(AnomalyFlag(
                flag_type="NEGATIVE_PRICE",
                severity="HIGH",
                description=f"Line item {i+1} has negative unit_price={item.unit_price}.",
                affected_field=f"line_items[{i}].unit_price",
            ))
    return flags


def _check_delivery_days(delivery_days: int) -> list[AnomalyFlag]:
    flags = []
    if delivery_days < 1:
        flags.append(AnomalyFlag(
            flag_type="IMPOSSIBLE_DELIVERY",
            severity="HIGH",
            description=f"Delivery days={delivery_days} is less than 1.",
            affected_field="delivery_days",
        ))
    elif delivery_days > 365:
        flags.append(AnomalyFlag(
            flag_type="EXCESSIVE_DELIVERY_TIME",
            severity="MEDIUM",
            description=f"Delivery days={delivery_days} exceeds 365.",
            affected_field="delivery_days",
        ))
    return flags


def _check_price_spike(
    items: list[QuotationLineItem],
    historical: Optional[list[dict]],
) -> list[AnomalyFlag]:
    """
    Compare unit prices against historical median for matching item descriptions.
    Spike threshold: unit_price > 2× median historical price.
    """
    flags = []
    if not historical:
        return flags

    # Build a lookup: keyword → list of unit prices from history
    price_map: dict[str, list[float]] = {}
    for past_q in historical:
        for item in past_q.get("line_items", []):
            keyword = item.get("description", "").lower().split()[0] if item.get("description") else None
            if keyword:
                price_map.setdefault(keyword, []).append(float(item.get("unit_price", 0)))

    for i, item in enumerate(items):
        keyword = item.description.lower().split()[0] if item.description else None
        if keyword and keyword in price_map:
            hist_prices = price_map[keyword]
            median_price = float(np.median(hist_prices))
            if median_price > 0 and item.unit_price > 2 * median_price:
                flags.append(AnomalyFlag(
                    flag_type="PRICE_SPIKE",
                    severity="HIGH",
                    description=(
                        f"Line item {i+1} '{item.description[:40]}': "
                        f"unit_price={item.unit_price} is {round(item.unit_price/median_price, 1)}× "
                        f"the historical median ({round(median_price, 2)})."
                    ),
                    affected_field=f"line_items[{i}].unit_price",
                ))
    return flags


def _check_identical_totals(items: list[QuotationLineItem]) -> list[AnomalyFlag]:
    """Flags if all line items have suspiciously identical total prices."""
    if len(items) < 3:
        return []
    totals = [item.total_price for item in items]
    if len(set(totals)) == 1:
        return [AnomalyFlag(
            flag_type="SUSPICIOUS_IDENTICAL_TOTALS",
            severity="MEDIUM",
            description="All line items have identical total_price values — possible fabrication.",
            affected_field="line_items",
        )]
    return []


# ── Isolation Forest ───────────────────────────────────────────────────────────

def _isolation_forest_score(
    req: AnomalyRequest,
    historical: list[dict],
) -> float:
    """
    Returns anomaly score 0–1 (higher = more anomalous).
    Returns 0 if sklearn unavailable or insufficient data.
    """
    if not SKLEARN_AVAILABLE or len(historical) < 5:
        return 0.0

    def _featurise(q: dict) -> list[float]:
        items = q.get("line_items", [])
        avg_price = (
            np.mean([float(i.get("unit_price", 0)) for i in items])
            if items else 0.0
        )
        return [
            float(q.get("total_amount", 0)),
            float(len(items)),
            float(q.get("delivery_days", 30)),
            float(avg_price),
        ]

    try:
        X_train = np.array([_featurise(q) for q in historical])
        clf = IsolationForest(contamination=0.1, random_state=42)
        clf.fit(X_train)

        current_items = req.line_items
        avg_price_current = (
            np.mean([item.unit_price for item in current_items])
            if current_items else 0.0
        )
        x_new = np.array([[
            req.total_amount,
            len(current_items),
            req.delivery_days,
            avg_price_current,
        ]])

        raw_score = clf.decision_function(x_new)[0]   # negative = more anomalous
        # Normalise to 0–1; decision_function range is roughly [-0.5, 0.5]
        normalised = float(np.clip(0.5 - raw_score, 0, 1))
        return round(normalised, 4)

    except Exception as e:
        logger.error(f"Isolation Forest error: {e}")
        return 0.0


# ── Main entry point ───────────────────────────────────────────────────────────

def run_anomaly_detection(req: AnomalyRequest) -> AnomalyResponse:
    historical = req.historical_quotations or []

    # Collect all rule flags
    all_flags: list[AnomalyFlag] = []
    all_flags += _check_math_integrity(req.line_items)
    all_flags += _check_zero_negative(req.line_items)
    all_flags += _check_delivery_days(req.delivery_days)
    all_flags += _check_price_spike(req.line_items, historical if historical else None)
    all_flags += _check_identical_totals(req.line_items)

    # Count flags by severity
    high_count   = sum(1 for f in all_flags if f.severity == "HIGH")
    medium_count = sum(1 for f in all_flags if f.severity == "MEDIUM")

    rules_score = min(1.0, (high_count * 0.25) + (medium_count * 0.10))

    # Isolation Forest score
    if_score = _isolation_forest_score(req, historical)

    # Blend: 60% rules + 40% IF (IF is 0 if not enough data)
    risk_score = round(0.6 * rules_score + 0.4 * if_score, 4)

    is_flagged = risk_score >= 0.25 or high_count > 0

    if risk_score < 0.25:
        recommendation = "Quotation appears clean. No significant anomalies detected."
    elif risk_score < 0.5:
        recommendation = "Minor concerns detected. Manual review recommended before shortlisting."
    elif risk_score < 0.75:
        recommendation = "Multiple anomalies found. Escalate for thorough review before proceeding."
    else:
        recommendation = "HIGH RISK: Strong indicators of fraud or error. Do not proceed without investigation."

    return AnomalyResponse(
        quotation_id  = req.quotation_id,
        risk_score    = risk_score,
        anomaly_flags = all_flags,
        is_flagged    = is_flagged,
        recommendation = recommendation,
    )
