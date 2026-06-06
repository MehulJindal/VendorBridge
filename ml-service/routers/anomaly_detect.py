from fastapi import APIRouter
from models.schemas import AnomalyRequest, AnomalyResponse
from services.anomaly_service import run_anomaly_detection

router = APIRouter()


@router.post("/detect/anomaly", response_model=AnomalyResponse)
def detect_anomaly(req: AnomalyRequest):
    """
    **Anomaly & Fraud Detection**

    Analyses a quotation using:

    **Rules-based checks (always run):**
    - Math integrity: total_price == quantity × unit_price
    - Zero/negative quantities or prices
    - Impossible delivery timelines
    - Price spikes vs historical median (>2× triggers flag)
    - Identical totals across all line items (fabrication indicator)

    **Isolation Forest (runs if ≥5 historical quotations provided):**
    - Features: total_amount, num_line_items, delivery_days, avg_unit_price
    - Trained on historical data; flags current quotation as outlier

    Returns a `risk_score` (0–1), list of `anomaly_flags`, and a human-readable `recommendation`.

    The `riskScore` and `anomalyFlags` fields are written back to the Quotation record
    via the Node.js `mlClient`.
    """
    return run_anomaly_detection(req)
