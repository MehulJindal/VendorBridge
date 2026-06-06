"""
VendorBridge ML Service
FastAPI microservice exposing 4 AI/ML endpoints for the VendorBridge ERP.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from routers import vendor_recommend, document_parse, anomaly_detect, spend_forecast
from utils.logger import logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("VendorBridge ML Service starting up...")
    yield
    logger.info("VendorBridge ML Service shutting down.")


app = FastAPI(
    title="VendorBridge ML Service",
    description="AI/ML microservice for procurement intelligence: vendor recommendations, OCR document parsing, anomaly detection, and spend forecasting.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(vendor_recommend.router, prefix="/api/ml", tags=["Vendor Recommendation"])
app.include_router(document_parse.router,   prefix="/api/ml", tags=["Document Parsing"])
app.include_router(anomaly_detect.router,   prefix="/api/ml", tags=["Anomaly Detection"])
app.include_router(spend_forecast.router,   prefix="/api/ml", tags=["Spend Forecasting"])


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "service": "VendorBridge ML Service"}
