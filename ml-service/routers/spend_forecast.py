from fastapi import APIRouter
from models.schemas import ForecastRequest, ForecastResponse
from services.forecast_service import run_spend_forecast

router = APIRouter()


@router.post("/forecast/spend", response_model=ForecastResponse)
def forecast_spend(req: ForecastRequest):
    """
    **Procurement Spend Forecasting**

    Accepts historical spend records (daily or any frequency) and produces
    a monthly forecast for the next N periods (default 6, max 24).

    **Models used (in priority order):**
    1. **Prophet** — handles seasonality + missing months (requires ≥3 data points)
    2. **ARIMA(1,1,1)** — classical time series (requires ≥5 data points)
    3. **Linear extrapolation** — naive fallback, always available

    Returns predicted amounts with 80% confidence intervals and a trend label
    (INCREASING / DECREASING / STABLE).

    Optionally filter by `category` to forecast spend for a single procurement category.
    """
    return run_spend_forecast(req)
