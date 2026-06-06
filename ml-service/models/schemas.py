"""
Shared Pydantic schemas for all ML endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


# ── Vendor Recommendation ──────────────────────────────────────────────────────

class HistoricalVendor(BaseModel):
    vendor_id: str
    company_name: str
    categories: list[str]
    rating: float = Field(ge=0, le=5)
    on_time_delivery_rate: float = Field(ge=0, le=100, description="Percentage 0–100")
    avg_price_competitiveness: float = Field(ge=0, le=100, description="Lower = cheaper relative to market")
    total_orders: int = Field(ge=0)
    awarded_quotations: int = Field(ge=0)
    total_quotations: int = Field(ge=0)
    is_verified: bool = True
    is_active: bool = True

class RecommendRequest(BaseModel):
    rfq_category: str
    rfq_budget: Optional[float] = None
    vendors: list[HistoricalVendor]

class VendorScore(BaseModel):
    vendor_id: str
    company_name: str
    composite_score: float
    rating_score: float
    delivery_score: float
    win_rate_score: float
    price_score: float
    rank: int

class RecommendResponse(BaseModel):
    rfq_category: str
    top_vendors: list[VendorScore]
    total_candidates: int


# ── Document Parsing ───────────────────────────────────────────────────────────

class ParsedLineItem(BaseModel):
    description: str
    quantity: float
    unit: str
    unit_price: float
    total_price: float

class DocumentParseRequest(BaseModel):
    file_base64: str = Field(description="Base64-encoded PDF or image content")
    file_type: str = Field(description="'pdf' or 'image'")
    filename: Optional[str] = None

class DocumentParseResponse(BaseModel):
    line_items: list[ParsedLineItem]
    vendor_name: Optional[str]
    invoice_number: Optional[str]
    total_amount: Optional[float]
    tax_rate: Optional[float]
    tax_amount: Optional[float]
    currency: str = "USD"
    confidence: float = Field(ge=0, le=1)
    raw_text_preview: str


# ── Anomaly Detection ──────────────────────────────────────────────────────────

class QuotationLineItem(BaseModel):
    description: str
    quantity: float
    unit: str
    unit_price: float
    total_price: float

class AnomalyRequest(BaseModel):
    quotation_id: str
    vendor_id: str
    rfq_id: str
    total_amount: float
    delivery_days: int
    line_items: list[QuotationLineItem]
    historical_quotations: Optional[list[dict]] = Field(
        default=None,
        description="Past quotations for same category to benchmark against"
    )

class AnomalyFlag(BaseModel):
    flag_type: str
    severity: str  # "LOW" | "MEDIUM" | "HIGH"
    description: str
    affected_field: Optional[str] = None

class AnomalyResponse(BaseModel):
    quotation_id: str
    risk_score: float = Field(ge=0, le=1, description="0=clean, 1=very suspicious")
    anomaly_flags: list[AnomalyFlag]
    is_flagged: bool
    recommendation: str


# ── Spend Forecasting ──────────────────────────────────────────────────────────

class SpendRecord(BaseModel):
    date: str = Field(description="ISO date string YYYY-MM-DD")
    amount: float
    category: Optional[str] = None

class ForecastRequest(BaseModel):
    historical_spend: list[SpendRecord]
    periods: int = Field(default=6, ge=1, le=24, description="Months to forecast")
    category: Optional[str] = Field(default=None, description="Filter by category")

class ForecastPoint(BaseModel):
    date: str
    predicted_amount: float
    lower_bound: float
    upper_bound: float

class ForecastResponse(BaseModel):
    category: Optional[str]
    periods_forecasted: int
    forecast: list[ForecastPoint]
    total_forecasted_spend: float
    avg_monthly_spend_historical: float
    trend: str  # "INCREASING" | "DECREASING" | "STABLE"
    model_used: str
