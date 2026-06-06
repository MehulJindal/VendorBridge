# VendorBridge ML Service

FastAPI microservice providing 4 AI/ML endpoints for the VendorBridge procurement ERP.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ml/recommend/vendors` | Smart vendor scoring & top-3 recommendation |
| POST | `/api/ml/parse/document` | OCR + LLM invoice/quotation extraction |
| POST | `/api/ml/detect/anomaly` | Isolation Forest + rules fraud detection |
| POST | `/api/ml/forecast/spend` | Prophet/ARIMA spend forecasting |
| GET  | `/health` | Service health check |

Swagger UI available at `http://localhost:8000/docs` when running.

## Setup

```bash
cd ml-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

> **Note:** The document parsing endpoint calls the Anthropic API.  
> The API key is forwarded automatically by the claude.ai proxy when running inside Claude artifacts.  
> For local dev, set `ANTHROPIC_API_KEY` in your environment before starting the service.

## Architecture

```
vendorbridge-api (Node.js/Express)
        │
        │  HTTP via mlClient.js
        ▼
ml-service (FastAPI / Python 3.11+)
  ├── /recommend/vendors  ← scoring model (numpy)
  ├── /parse/document     ← Claude Vision API
  ├── /detect/anomaly     ← Isolation Forest + rules (sklearn)
  └── /forecast/spend     ← Prophet → ARIMA → linear fallback
```

## How anomaly detection integrates

When a vendor submits a quotation (`POST /api/quotations/rfq/:rfqId`), the Node.js API:
1. Saves the quotation to MongoDB
2. Fires a **non-blocking** background call to `/api/ml/detect/anomaly`
3. Writes `riskScore` + `anomalyFlags` back to the quotation record

Procurement officers see these flags when reviewing bids.

## Model details

### Vendor Recommendation
Weighted composite score:
- Rating: 30%
- On-time delivery rate: 30%
- Win rate (awarded/total quotations): 25%
- Price competitiveness (inverted): 15%

### Anomaly Detection
Rules checked:
- Math integrity (total_price == qty × unit_price)
- Zero/negative quantities or prices
- Impossible delivery timelines (< 1 day or > 365 days)
- Price spikes > 2× historical median
- Identical totals across all line items

Isolation Forest trained on: `[total_amount, num_line_items, delivery_days, avg_unit_price]`

Risk score = 60% rules + 40% Isolation Forest (IF score = 0 if < 5 historical samples).

### Spend Forecasting
Model priority:
1. **Prophet** (requires ≥ 3 monthly data points) — handles seasonality
2. **ARIMA(1,1,1)** (requires ≥ 5 data points) — classical TS
3. **Linear extrapolation** — always available fallback
