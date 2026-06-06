import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

// ── Submit Quotation ───────────────────────────────────────────────────────────
// POST /api/quotations/rfq/:rfqId
// Access: VENDOR only.

export const submitQuotation = async (req, res) => {
  const { rfqId } = req.params;
  const { lineItems, totalAmount, currency, validityDays, deliveryDays, notes } = req.body;

  // ── Field validation ─────────────────────────────────────────────────────────
  if (!lineItems || !totalAmount || !validityDays || !deliveryDays) {
    throw new ApiError(400, "lineItems, totalAmount, validityDays, and deliveryDays are required.");
  }

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new ApiError(400, "lineItems must be a non-empty array.");
  }

  const requiredLineItemFields = ["description", "quantity", "unit", "unitPrice", "totalPrice"];
  lineItems.forEach((item, idx) => {
    const missing = requiredLineItemFields.filter((f) => item[f] == null);
    if (missing.length) {
      throw new ApiError(
        400,
        `lineItems[${idx}] is missing required fields: ${missing.join(", ")}.`
      );
    }
  });

  // ── RFQ guard ────────────────────────────────────────────────────────────────
  const rfq = await prisma.rFQ.findUnique({ where: { id: rfqId } });

  if (!rfq) throw new ApiError(404, `RFQ with id "${rfqId}" not found.`);
  if (rfq.status !== "PUBLISHED") {
    throw new ApiError(400, `Bids can only be submitted on PUBLISHED RFQs. Current status: "${rfq.status}".`);
  }
  if (new Date() > new Date(rfq.submissionDeadline)) {
    throw new ApiError(400, "The submission deadline for this RFQ has passed.");
  }

  // ── Duplicate bid guard ──────────────────────────────────────────────────────
  const existingBid = await prisma.quotation.findFirst({
    where: { rfqId, vendorId: req.vendor.id },
  });
  if (existingBid) {
    throw new ApiError(409, "You have already submitted a quotation for this RFQ.");
  }

  // ── Sequential quotation number ──────────────────────────────────────────────
  const count = await prisma.quotation.count();
  const quotationNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const quotation = await prisma.quotation.create({
    data: {
      quotationNumber,
      lineItems,
      totalAmount:  Number(totalAmount),
      currency:     currency ?? "USD",
      validityDays: Number(validityDays),
      deliveryDays: Number(deliveryDays),
      notes:        notes ?? null,
      status:       "SUBMITTED",
      rfqId,
      vendorId:     req.vendor.id,
    },
  });

  sendSuccess(res, quotation, "Quotation submitted successfully.", 201);
};

// ── Get Quotations For RFQ ─────────────────────────────────────────────────────
// GET /api/quotations/rfq/:rfqId
// Access: Internal users see all bids. Vendors see only their own.

export const getQuotationsForRFQ = async (req, res) => {
  const { rfqId } = req.params;
  const isVendor  = req.userType === "VENDOR";

  // Confirm the RFQ exists first — same 404 regardless of caller type
  const rfq = await prisma.rFQ.findUnique({
    where:  { id: rfqId },
    select: { id: true, rfqNumber: true, title: true, status: true },
  });

  if (!rfq) throw new ApiError(404, `RFQ with id "${rfqId}" not found.`);

  // Vendors may only probe RFQs that are visible to them
  if (isVendor && rfq.status !== "PUBLISHED") {
    throw new ApiError(404, `RFQ with id "${rfqId}" not found.`);
  }

  const where = isVendor
    ? { rfqId, vendorId: req.vendor.id }  // vendor sees only their own bid
    : { rfqId };                           // internal users see all bids

  const quotations = await prisma.quotation.findMany({
    where,
    orderBy: { submittedAt: "asc" },
    include: isVendor
      ? false   // vendor already knows their own identity; no extra join needed
      : {
          // Internal users get vendor summary alongside each bid for comparison
          vendor: {
            select: {
              id:          true,
              companyName: true,
              email:       true,
              rating:      true,
              isVerified:  true,
            },
          },
        },
  });

  sendSuccess(
    res,
    { rfq, quotations },
    `${quotations.length} quotation(s) fetched successfully.`
  );
};

// ── Update Quotation Status ────────────────────────────────────────────────────
// PATCH /api/quotations/:id/status
// Access: ADMIN, MANAGER only.
// If ACCEPTED: atomically awards the parent RFQ in the same transaction.

const VALID_TRANSITIONS = {
  SUBMITTED:    ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED:  ["AWARDED",     "REJECTED"],
  REJECTED:     [],   // terminal
  AWARDED:      [],   // terminal
};

export const updateQuotationStatus = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  const ALLOWED_STATUSES = Object.keys(VALID_TRANSITIONS);

  if (!status) throw new ApiError(400, "status is required in the request body.");
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}.`);
  }

  const quotation = await prisma.quotation.findUnique({
    where:   { id },
    include: { rfq: { select: { id: true, status: true, rfqNumber: true } } },
  });

  if (!quotation) throw new ApiError(404, `Quotation with id "${id}" not found.`);

  const allowedNext = VALID_TRANSITIONS[quotation.status];
  if (!allowedNext.includes(status)) {
    throw new ApiError(
      400,
      `Cannot transition quotation from "${quotation.status}" to "${status}". ` +
      `Allowed next states: ${allowedNext.length ? allowedNext.join(", ") : "none (terminal state)"}.`
    );
  }

  // ── Non-awarding update — single write ───────────────────────────────────────
  if (status !== "AWARDED") {
    const updated = await prisma.quotation.update({
      where: { id },
      data:  { status },
    });
    return sendSuccess(res, updated, `Quotation status updated to "${status}" successfully.`);
  }

  // ── AWARDED path — Prisma interactive transaction ────────────────────────────
  // Guarantees both writes succeed or both roll back; no orphaned award state.
  const [updatedQuotation, updatedRFQ] = await prisma.$transaction(async (tx) => {
    // 1. Mark this quotation as AWARDED
    const awarded = await tx.quotation.update({
      where: { id },
      data:  { status: "AWARDED" },
    });

    // 2. Reject every other SUBMITTED / UNDER_REVIEW / SHORTLISTED bid on the same RFQ
    await tx.quotation.updateMany({
      where: {
        rfqId:  quotation.rfqId,
        id:     { not: id },
        status: { in: ["SUBMITTED", "UNDER_REVIEW", "SHORTLISTED"] },
      },
      data: { status: "REJECTED" },
    });

    // 3. Close the parent RFQ
    const closedRFQ = await tx.rFQ.update({
      where: { id: quotation.rfqId },
      data:  { status: "AWARDED" },
    });

    return [awarded, closedRFQ];
  });

  sendSuccess(
    res,
    { quotation: updatedQuotation, rfq: updatedRFQ },
    `Quotation awarded. RFQ "${updatedRFQ.rfqNumber}" has been marked as AWARDED and all competing bids rejected.`
  );
};