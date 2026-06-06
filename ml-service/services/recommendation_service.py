"""
Smart Vendor Recommendation Engine
------------------------------------
Scores vendors on 4 weighted dimensions and returns the top-3 matches
for a given RFQ category.

Weights (tunable):
  - Rating score          : 30%
  - On-time delivery rate : 30%
  - Win rate              : 25%
  - Price competitiveness : 15%
"""

import numpy as np
from models.schemas import (
    RecommendRequest,
    RecommendResponse,
    VendorScore,
    HistoricalVendor,
)


# ── Weight configuration ───────────────────────────────────────────────────────
WEIGHTS = {
    "rating":    0.30,
    "delivery":  0.30,
    "win_rate":  0.25,
    "price":     0.15,
}


def _score_vendor(vendor: HistoricalVendor) -> dict:
    """
    Compute normalised sub-scores (0–1) for a single vendor.
    Rating (0–5) → divide by 5
    Delivery rate (0–100%) → divide by 100
    Win rate = awarded / total quotations (0–1)
    Price competitiveness: lower avg_price_competitiveness → better → invert
    """
    rating_score    = vendor.rating / 5.0

    delivery_score  = vendor.on_time_delivery_rate / 100.0

    win_rate_score  = (
        vendor.awarded_quotations / vendor.total_quotations
        if vendor.total_quotations > 0
        else 0.0
    )

    # avg_price_competitiveness is 0–100 where lower = cheaper
    # Invert so higher score = more competitive
    price_score = 1.0 - (vendor.avg_price_competitiveness / 100.0)

    composite = (
        WEIGHTS["rating"]   * rating_score   +
        WEIGHTS["delivery"] * delivery_score  +
        WEIGHTS["win_rate"] * win_rate_score  +
        WEIGHTS["price"]    * price_score
    )

    return {
        "rating_score":    round(rating_score, 4),
        "delivery_score":  round(delivery_score, 4),
        "win_rate_score":  round(win_rate_score, 4),
        "price_score":     round(price_score, 4),
        "composite_score": round(composite, 4),
    }


def run_recommendation(req: RecommendRequest) -> RecommendResponse:
    """
    Filter vendors matching the RFQ category (case-insensitive),
    score them, sort descending by composite score, and return top 3.
    """
    category_lower = req.rfq_category.lower()

    # Category filter — keep verified + active vendors only
    candidates = [
        v for v in req.vendors
        if v.is_active
        and v.is_verified
        and any(c.lower() == category_lower for c in v.categories)
    ]

    if not candidates:
        # Fallback: relax category filter to return best available vendors
        candidates = [v for v in req.vendors if v.is_active and v.is_verified]

    scored = []
    for vendor in candidates:
        scores = _score_vendor(vendor)
        scored.append(
            VendorScore(
                vendor_id        = vendor.vendor_id,
                company_name     = vendor.company_name,
                composite_score  = scores["composite_score"],
                rating_score     = scores["rating_score"],
                delivery_score   = scores["delivery_score"],
                win_rate_score   = scores["win_rate_score"],
                price_score      = scores["price_score"],
                rank             = 0,  # filled below
            )
        )

    # Sort descending and assign ranks
    scored.sort(key=lambda x: x.composite_score, reverse=True)
    for i, v in enumerate(scored):
        v.rank = i + 1

    return RecommendResponse(
        rfq_category     = req.rfq_category,
        top_vendors      = scored[:3],
        total_candidates = len(candidates),
    )
