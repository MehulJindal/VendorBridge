import axios from "axios";

// ── Base client ────────────────────────────────────────────────────────────────
export const mlClient = axios.create({
  baseURL: process.env.ML_SERVICE_URL || "http://localhost:8000",
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// ── 1. Vendor Recommendation ──────────────────────────────────────────────────
/**
 * Returns top-3 vendor recommendations for an RFQ category.
 * @param {string} rfqCategory  - e.g. "Electronics"
 * @param {Array}  vendors      - array of vendor performance objects
 * @param {number} [rfqBudget]  - optional budget hint
 */
export async function recommendVendors(rfqCategory, vendors, rfqBudget = null) {
  const { data } = await mlClient.post("/api/ml/recommend/vendors", {
    rfq_category: rfqCategory,
    rfq_budget: rfqBudget,
    vendors,
  });
  return data;
}

// ── 2. Document Parsing ────────────────────────────────────────────────────────
/**
 * Extracts line items and metadata from a base64-encoded PDF or image.
 * @param {string} fileBase64 - base64 string of the document
 * @param {string} fileType   - "pdf" | "image"
 * @param {string} [filename]
 */
export async function parseDocument(fileBase64, fileType, filename = null) {
  const { data } = await mlClient.post("/api/ml/parse/document", {
    file_base64: fileBase64,
    file_type:   fileType,
    filename,
  });
  return data;
}

// ── 3. Anomaly Detection ───────────────────────────────────────────────────────
/**
 * Analyses a quotation for fraud / anomaly signals.
 * Writes riskScore + anomalyFlags back to the Quotation record.
 *
 * @param {object} quotation          - Prisma quotation object (with lineItems)
 * @param {Array}  [historicalQuotes] - past quotations for same category (optional)
 */
export async function detectAnomaly(quotation, historicalQuotes = []) {
  const payload = {
    quotation_id:           quotation.id,
    vendor_id:              quotation.vendorId,
    rfq_id:                 quotation.rfqId,
    total_amount:           quotation.totalAmount,
    delivery_days:          quotation.deliveryDays,
    line_items:             quotation.lineItems.map((li) => ({
      description: li.description,
      quantity:    li.quantity,
      unit:        li.unit,
      unit_price:  li.unitPrice,
      total_price: li.totalPrice,
    })),
    historical_quotations:  historicalQuotes.map((q) => ({
      total_amount:  q.totalAmount,
      delivery_days: q.deliveryDays,
      line_items:    (q.lineItems || []).map((li) => ({
        description: li.description,
        quantity:    li.quantity,
        unit:        li.unit,
        unit_price:  li.unitPrice,
        total_price: li.totalPrice,
      })),
    })),
  };

  const { data } = await mlClient.post("/api/ml/detect/anomaly", payload);
  return data;
}

// ── 4. Spend Forecasting ───────────────────────────────────────────────────────
/**
 * Forecasts monthly procurement spend for the next N months.
 * @param {Array}  historicalSpend - array of { date, amount, category? }
 * @param {number} [periods=6]     - months to forecast (1–24)
 * @param {string} [category]      - optional category filter
 */
export async function forecastSpend(historicalSpend, periods = 6, category = null) {
  const { data } = await mlClient.post("/api/ml/forecast/spend", {
    historical_spend: historicalSpend.map((r) => ({
      date:     r.date instanceof Date ? r.date.toISOString().split("T")[0] : r.date,
      amount:   r.amount,
      category: r.category ?? null,
    })),
    periods,
    category,
  });
  return data;
}
