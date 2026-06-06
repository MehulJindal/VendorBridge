import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

// ── Create Invoice ─────────────────────────────────────────────────────────────
// POST /api/invoices
// Access: VENDOR only.
// PO must belong to the calling vendor and be in a fulfillable state.

export const createInvoice = async (req, res) => {
  const { poId, dueDate, notes, lineItems, subtotal, taxRate } = req.body;

  if (!poId || !dueDate || !lineItems || subtotal == null) {
    throw new ApiError(400, "poId, dueDate, lineItems, and subtotal are required.");
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

  // ── PO ownership + state guard ───────────────────────────────────────────────
  const po = await prisma.purchaseOrder.findUnique({
    where:   { id: poId },
    include: {
      quotation: { select: { vendorId: true, id: true, quotationNumber: true } },
    },
  });

  if (!po) throw new ApiError(404, `Purchase Order with id "${poId}" not found.`);

  // Mask as 404 so vendors cannot probe POs belonging to other vendors
  if (po.quotation.vendorId !== req.vendor.id) {
    throw new ApiError(404, `Purchase Order with id "${poId}" not found.`);
  }

  // Only invoice against POs that have actual delivery progress
  const INVOICEABLE_STATUSES = ["ACKNOWLEDGED", "PARTIALLY_FULFILLED", "FULFILLED"];
  if (!INVOICEABLE_STATUSES.includes(po.status)) {
    throw new ApiError(
      400,
      `An invoice can only be raised against a PO with status: ${INVOICEABLE_STATUSES.join(", ")}. ` +
      `Current status: "${po.status}".`
    );
  }

  // ── Idempotency guard — one invoice per PO ───────────────────────────────────
  const existingInvoice = await prisma.invoice.findUnique({
    where: { purchaseOrderId: poId },
  });
  if (existingInvoice) {
    throw new ApiError(
      409,
      `An invoice (${existingInvoice.invoiceNumber}) has already been submitted for this Purchase Order.`
    );
  }

  // ── Compute tax and total ────────────────────────────────────────────────────
  const resolvedTaxRate  = taxRate != null ? Number(taxRate) : 0;
  const resolvedSubtotal = Number(subtotal);
  const taxAmount        = parseFloat((resolvedSubtotal * (resolvedTaxRate / 100)).toFixed(2));
  const totalAmount      = parseFloat((resolvedSubtotal + taxAmount).toFixed(2));

  // ── Sequential invoice number ────────────────────────────────────────────────
  const count = await prisma.invoice.count();
  const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber,
      lineItems,
      subtotal:       resolvedSubtotal,
      taxRate:        resolvedTaxRate,
      taxAmount,
      totalAmount,
      currency:       po.currency,
      status:         "SUBMITTED",
      dueDate:        new Date(dueDate),
      notes:          notes ?? null,
      purchaseOrderId: poId,
      vendorId:       req.vendor.id,
    },
    include: {
      purchaseOrder: {
        select: { id: true, poNumber: true, status: true },
      },
      vendor: {
        select: { id: true, companyName: true, email: true },
      },
    },
  });

  sendSuccess(res, invoice, "Invoice submitted successfully.", 201);
};

// ── Get All Invoices ───────────────────────────────────────────────────────────
// GET /api/invoices
// Access: Vendors see only their own invoices. Internal users see all.

export const getInvoices = async (req, res) => {
  const isVendor = req.userType === "VENDOR";

  const where = isVendor ? { vendorId: req.vendor.id } : {};

  // Optional filters surfaced to internal users only
  if (!isVendor) {
    if (req.query.status)   where.status   = req.query.status;
    if (req.query.vendorId) where.vendorId = req.query.vendorId;
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id:            true,
      invoiceNumber: true,
      totalAmount:   true,
      currency:      true,
      status:        true,
      dueDate:       true,
      paidAt:        true,
      createdAt:     true,
      vendor: {
        select: { id: true, companyName: true, isVerified: true },
      },
      purchaseOrder: {
        select: {
          id:       true,
          poNumber: true,
          status:   true,
          quotation: {
            select: {
              rfq: { select: { id: true, rfqNumber: true, title: true } },
            },
          },
        },
      },
    },
  });

  sendSuccess(res, invoices, `${invoices.length} invoice(s) fetched successfully.`);
};

// ── Get Invoice By ID ──────────────────────────────────────────────────────────
// GET /api/invoices/:id
// Access: Internal users see any invoice. Vendors see only their own.

export const getInvoiceById = async (req, res) => {
  const { id } = req.params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      vendor: {
        select: {
          id:            true,
          companyName:   true,
          email:         true,
          rating:        true,
          isVerified:    true,
          contactPerson: true,
          address:       true,
        },
      },
      purchaseOrder: {
        include: {
          quotation: {
            select: {
              id:              true,
              quotationNumber: true,
              totalAmount:     true,
              currency:        true,
              rfq: {
                select: {
                  id:          true,
                  rfqNumber:   true,
                  title:       true,
                  description: true,
                  category:    true,
                },
              },
            },
          },
          creator: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  if (!invoice) throw new ApiError(404, `Invoice with id "${id}" not found.`);

  // Vendors may only access their own invoices — mask as 404 to prevent probing
  if (req.userType === "VENDOR" && invoice.vendorId !== req.vendor.id) {
    throw new ApiError(404, `Invoice with id "${id}" not found.`);
  }

  sendSuccess(res, invoice, "Invoice fetched successfully.");
};

// ── Update Invoice Status ──────────────────────────────────────────────────────
// PATCH /api/invoices/:id/status
// Access: ADMIN, MANAGER, FINANCE only.
// Stamping paidAt on PAID transition is handled automatically.

const VALID_TRANSITIONS = {
  DRAFT:     ["SUBMITTED"],
  SUBMITTED: ["APPROVED", "DISPUTED", "CANCELLED"],
  APPROVED:  ["PAID",     "DISPUTED", "CANCELLED"],
  DISPUTED:  ["SUBMITTED", "CANCELLED"],  // disputed invoice can be resubmitted or dropped
  PAID:      [],   // terminal
  CANCELLED: [],   // terminal
};

export const updateInvoiceStatus = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;

  const ALLOWED_STATUSES = Object.keys(VALID_TRANSITIONS);

  if (!status) throw new ApiError(400, "status is required in the request body.");
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}.`
    );
  }

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) throw new ApiError(404, `Invoice with id "${id}" not found.`);

  const allowedNext = VALID_TRANSITIONS[invoice.status];
  if (!allowedNext.includes(status)) {
    throw new ApiError(
      400,
      `Cannot transition invoice from "${invoice.status}" to "${status}". ` +
      `Allowed next states: ${allowedNext.length ? allowedNext.join(", ") : "none (terminal state)"}.`
    );
  }

  // ── PAID path — atomic: stamp paidAt + mark PO as FULFILLED if not already ──
  if (status === "PAID") {
    const [updatedInvoice, updatedPO] = await prisma.$transaction(async (tx) => {
      const paid = await tx.invoice.update({
        where: { id },
        data:  { status: "PAID", paidAt: new Date() },
      });

      // Automatically close the PO if it isn't already in a terminal state
      const po = await tx.purchaseOrder.findUnique({
        where:  { id: invoice.purchaseOrderId },
        select: { status: true },
      });

      let closedPO = po;
      if (po.status !== "FULFILLED" && po.status !== "CANCELLED") {
        closedPO = await tx.purchaseOrder.update({
          where: { id: invoice.purchaseOrderId },
          data:  { status: "FULFILLED" },
        });
      }

      return [paid, closedPO];
    });

    return sendSuccess(
      res,
      { invoice: updatedInvoice, purchaseOrder: updatedPO },
      `Invoice marked as PAID and Purchase Order "${updatedPO.poNumber ?? invoice.purchaseOrderId}" closed.`
    );
  }

  // ── All other transitions — single write ─────────────────────────────────────
  const updated = await prisma.invoice.update({
    where: { id },
    data:  { status },
  });

  sendSuccess(res, updated, `Invoice status updated to "${status}" successfully.`);
};