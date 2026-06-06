import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
import {
  recommendVendors,
  parseDocument,
  detectAnomaly,
  forecastSpend,
} from "../../utils/mlClient.js";

const router = Router();
router.use(protect);

// ── POST /api/ml/recommend/vendors ────────────────────────────────────────────
// Procurement Officers: get top-3 vendor suggestions for an RFQ.
// Body: { rfqId, rfqBudget? }
router.post(
  "/recommend/vendors",
  restrictTo("ADMIN", "MANAGER", "PROCUREMENT_OFFICER"),
  async (req, res) => {
    const { rfqId, rfqBudget } = req.body;
    if (!rfqId) throw new ApiError(400, "rfqId is required.");

    const rfq = await prisma.rFQ.findUnique({
      where:  { id: rfqId },
      select: { id: true, category: true },
    });
    if (!rfq) throw new ApiError(404, `RFQ "${rfqId}" not found.`);

    // Pull all active verified vendors with performance history
    const vendors = await prisma.vendor.findMany({
      where:  { isActive: true, isVerified: true },
      select: {
        id:          true,
        companyName: true,
        categories:  true,
        rating:      true,
        isVerified:  true,
        isActive:    true,
        quotations:  {
          select: { status: true },
        },
      },
    });

    const vendorPayload = vendors.map((v) => {
      const total    = v.quotations.length;
      const awarded  = v.quotations.filter((q) => q.status === "AWARDED").length;
      return {
        vendor_id:                   v.id,
        company_name:                v.companyName,
        categories:                  v.categories,
        rating:                      v.rating ?? 0,
        on_time_delivery_rate:       75,      // TODO: compute from PO fulfillment data
        avg_price_competitiveness:   50,      // TODO: compute from quotation benchmarks
        total_orders:                total,
        awarded_quotations:          awarded,
        total_quotations:            total,
        is_verified:                 v.isVerified,
        is_active:                   v.isActive,
      };
    });

    const result = await recommendVendors(rfq.category, vendorPayload, rfqBudget ?? null);
    sendSuccess(res, result, "Vendor recommendations generated successfully.");
  }
);

// ── POST /api/ml/parse/document ───────────────────────────────────────────────
// Vendors: upload invoice/quotation PDF or image for auto-parsing.
// Body: { fileBase64, fileType, filename? }
router.post(
  "/parse/document",
  restrictTo("VENDOR", "ADMIN", "MANAGER", "PROCUREMENT_OFFICER"),
  async (req, res) => {
    const { fileBase64, fileType, filename } = req.body;
    if (!fileBase64 || !fileType) {
      throw new ApiError(400, "fileBase64 and fileType are required.");
    }
    if (!["pdf", "image"].includes(fileType)) {
      throw new ApiError(400, 'fileType must be "pdf" or "image".');
    }
    const result = await parseDocument(fileBase64, fileType, filename ?? null);
    sendSuccess(res, result, "Document parsed successfully.");
  }
);

// ── POST /api/ml/detect/anomaly ───────────────────────────────────────────────
// Internal: manually re-run anomaly detection on an existing quotation.
// Body: { quotationId }
router.post(
  "/detect/anomaly",
  restrictTo("ADMIN", "MANAGER"),
  async (req, res) => {
    const { quotationId } = req.body;
    if (!quotationId) throw new ApiError(400, "quotationId is required.");

    const quotation = await prisma.quotation.findUnique({
      where:   { id: quotationId },
      include: { rfq: { select: { category: true } } },
    });
    if (!quotation) throw new ApiError(404, `Quotation "${quotationId}" not found.`);

    const historical = await prisma.quotation.findMany({
      where: {
        rfq:    { category: quotation.rfq.category },
        id:     { not: quotationId },
        status: { notIn: ["REJECTED"] },
      },
      take:   50,
      select: { totalAmount: true, deliveryDays: true, lineItems: true },
    });

    const mlResult = await detectAnomaly(quotation, historical);

    // Persist results
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        riskScore:    mlResult.risk_score,
        anomalyFlags: mlResult.anomaly_flags.map(
          (f) => `[${f.severity}] ${f.flag_type}: ${f.description}`
        ),
      },
    });

    sendSuccess(res, mlResult, "Anomaly detection completed.");
  }
);

// ── POST /api/ml/forecast/spend ───────────────────────────────────────────────
// Managers/Admins: forecast procurement spend for the next N months.
// Body: { periods?, category? }
router.post(
  "/forecast/spend",
  restrictTo("ADMIN", "MANAGER"),
  async (req, res) => {
    const { periods = 6, category } = req.body;

    // Aggregate paid invoices as historical spend records
    const invoices = await prisma.invoice.findMany({
      where: {
        status:  "PAID",
        paidAt:  { not: null },
        ...(category && {
          purchaseOrder: { quotation: { rfq: { category } } },
        }),
      },
      select: {
        paidAt:      true,
        totalAmount: true,
        purchaseOrder: {
          select: {
            quotation: {
              select: { rfq: { select: { category: true } } },
            },
          },
        },
      },
      orderBy: { paidAt: "asc" },
    });

    const historicalSpend = invoices.map((inv) => ({
      date:     inv.paidAt.toISOString().split("T")[0],
      amount:   inv.totalAmount,
      category: inv.purchaseOrder?.quotation?.rfq?.category ?? null,
    }));

    const result = await forecastSpend(historicalSpend, Number(periods), category ?? null);
    sendSuccess(res, result, "Spend forecast generated successfully.");
  }
);

export default router;
