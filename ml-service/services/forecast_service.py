"""
Procurement Spend Forecasting
-------------------------------
Uses Prophet (primary) or ARIMA via statsmodels (fallback) to produce
monthly spend forecasts with confidence intervals.

Strategy:
  1. Aggregate daily spend records → monthly totals
  2. Fit Prophet model (robust to missing months, seasonality)
  3. If Prophet unavailable, fallback to ARIMA(1,1,1)
  4. Return forecast points with lower/upper 80% CI
"""

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Optional
from models.schemas import (
    ForecastRequest,
    ForecastResponse,
    ForecastPoint,
    SpendRecord,
)
from utils.logger import logger

# Try Prophet first, then statsmodels ARIMA
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logger.warning("Prophet not installed — will try statsmodels ARIMA.")

try:
    from statsmodels.tsa.arima.model import ARIMA
    ARIMA_AVAILABLE = True
except ImportError:
    ARIMA_AVAILABLE = False
    logger.warning("statsmodels not installed — using naive trend extrapolation.")


# ── Data preparation ───────────────────────────────────────────────────────────

def _prepare_monthly(records: list[SpendRecord], category: Optional[str]) -> pd.DataFrame:
    """
    Filter by category (if given), parse dates, and resample to monthly totals.
    Returns DataFrame with columns: ds (month start), y (total spend).
    """
    rows = []
    for r in records:
        if category and r.category and r.category.lower() != category.lower():
            continue
        try:
            dt = pd.to_datetime(r.date)
            rows.append({"ds": dt, "y": float(r.amount)})
        except Exception:
            continue

    if not rows:
        return pd.DataFrame(columns=["ds", "y"])

    df = pd.DataFrame(rows)
    df = df.set_index("ds").resample("MS")["y"].sum().reset_index()
    df = df.sort_values("ds").reset_index(drop=True)
    return df


def _trend_label(df: pd.DataFrame, forecast_total: float) -> str:
    if len(df) < 2:
        return "STABLE"
    hist_mean = df["y"].mean()
    forecast_mean = forecast_total / max(1, len(df))
    ratio = forecast_mean / max(hist_mean, 1)
    if ratio > 1.10:
        return "INCREASING"
    elif ratio < 0.90:
        return "DECREASING"
    return "STABLE"


# ── Forecast backends ──────────────────────────────────────────────────────────

def _forecast_prophet(df: pd.DataFrame, periods: int) -> list[dict]:
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        interval_width=0.80,
        uncertainty_samples=200,
    )
    model.fit(df)
    future = model.make_future_dataframe(periods=periods, freq="MS")
    forecast_df = model.predict(future)
    future_rows = forecast_df[forecast_df["ds"] > df["ds"].max()].tail(periods)
    return [
        {
            "date": row["ds"].strftime("%Y-%m-%d"),
            "predicted_amount": max(0, round(row["yhat"], 2)),
            "lower_bound": max(0, round(row["yhat_lower"], 2)),
            "upper_bound": max(0, round(row["yhat_upper"], 2)),
        }
        for _, row in future_rows.iterrows()
    ]


def _forecast_arima(df: pd.DataFrame, periods: int) -> list[dict]:
    y = df["y"].values
    model = ARIMA(y, order=(1, 1, 1))
    result = model.fit()
    forecast_obj = result.get_forecast(steps=periods)
    pred = forecast_obj.predicted_mean
    ci = forecast_obj.conf_int(alpha=0.20)   # 80% CI

    last_date = df["ds"].max()
    future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq="MS")

    return [
        {
            "date": dt.strftime("%Y-%m-%d"),
            "predicted_amount": max(0, round(float(pred[i]), 2)),
            "lower_bound": max(0, round(float(ci.iloc[i, 0]), 2)),
            "upper_bound": max(0, round(float(ci.iloc[i, 1]), 2)),
        }
        for i, dt in enumerate(future_dates)
    ]


def _forecast_naive(df: pd.DataFrame, periods: int) -> list[dict]:
    """
    Simple linear extrapolation when no ML library is available.
    Uses least-squares fit on month index → spend.
    """
    n = len(df)
    x = np.arange(n, dtype=float)
    y = df["y"].values.astype(float)

    if n >= 2:
        coeffs = np.polyfit(x, y, 1)
        slope, intercept = coeffs
    else:
        slope, intercept = 0.0, float(y.mean()) if len(y) else 0.0

    std = float(np.std(y)) if len(y) > 1 else 0.0
    last_date = df["ds"].max()
    future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=periods, freq="MS")

    return [
        {
            "date": dt.strftime("%Y-%m-%d"),
            "predicted_amount": max(0, round(slope * (n + i) + intercept, 2)),
            "lower_bound": max(0, round(slope * (n + i) + intercept - 1.28 * std, 2)),
            "upper_bound": max(0, round(slope * (n + i) + intercept + 1.28 * std, 2)),
        }
        for i, dt in enumerate(future_dates)
    ]


# ── Main entry point ───────────────────────────────────────────────────────────

def run_spend_forecast(req: ForecastRequest) -> ForecastResponse:
    df = _prepare_monthly(req.historical_spend, req.category)

    avg_historical = round(float(df["y"].mean()), 2) if len(df) > 0 else 0.0

    if len(df) < 2:
        # Not enough data — return flat forecast
        logger.warning("Insufficient historical data for forecasting. Returning flat forecast.")
        last_date = pd.Timestamp.now()
        future_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=req.periods, freq="MS")
        points = [
            ForecastPoint(
                date=dt.strftime("%Y-%m-%d"),
                predicted_amount=avg_historical,
                lower_bound=avg_historical * 0.8,
                upper_bound=avg_historical * 1.2,
            )
            for dt in future_dates
        ]
        return ForecastResponse(
            category=req.category,
            periods_forecasted=req.periods,
            forecast=points,
            total_forecasted_spend=round(avg_historical * req.periods, 2),
            avg_monthly_spend_historical=avg_historical,
            trend="STABLE",
            model_used="flat_fallback",
        )

    # Try forecasting backends in order of preference
    raw_points = None
    model_used = "unknown"

    if PROPHET_AVAILABLE and len(df) >= 3:
        try:
            raw_points = _forecast_prophet(df, req.periods)
            model_used = "prophet"
        except Exception as e:
            logger.error(f"Prophet failed: {e}")

    if raw_points is None and ARIMA_AVAILABLE and len(df) >= 5:
        try:
            raw_points = _forecast_arima(df, req.periods)
            model_used = "arima_1_1_1"
        except Exception as e:
            logger.error(f"ARIMA failed: {e}")

    if raw_points is None:
        raw_points = _forecast_naive(df, req.periods)
        model_used = "linear_extrapolation"

    points = [ForecastPoint(**p) for p in raw_points]
    total_forecasted = round(sum(p.predicted_amount for p in points), 2)

    return ForecastResponse(
        category=req.category,
        periods_forecasted=req.periods,
        forecast=points,
        total_forecasted_spend=total_forecasted,
        avg_monthly_spend_historical=avg_historical,
        trend=_trend_label(df, total_forecasted),
        model_used=model_used,
    )
