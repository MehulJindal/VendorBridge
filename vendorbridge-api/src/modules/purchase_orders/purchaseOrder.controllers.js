import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

// ── Create Purchase Order ──────────────────────────────────────────────────────
// POST /api/purchase-orders
// Access: ADMIN, MANAGER only.
// Quotation must be in AWARDED status before a PO can be raised against it.

export const createPO = async (req, res) => {
  const { quotationId, expectedDeliveryDate, deliveryAddress } = req.body;

  if (!quotationId) {
    throw new ApiError(400, "quotationId is required.");
  }

  // Validate deliveryAddress matches Prisma embedded Address type
  const requiredAddressFields = ["street", "city", "state", "country", "zipCode"];
  const missingAddress = requiredAddressFields.filter((f) => !deliveryAddress?.[f]);
  if (missingAddress.length) {
    throw new ApiError(
      400,
      `deliveryAddress is missing required fields: ${missingAddress.join(", ")}.`
    );
  }

  // ── Quotation guard ──────────────────────────────────────────────────────────
  const quotation = await prisma.quotation.findUnique({
    where:   { id: quotationId },
    include: {
      rfq:    { select: { id: true, rfqNumber: true, status: true, title: true } },
      vendor: { select: { id: true, companyName: true } },
    },
  });

  if (!quotation) {
    throw new ApiError(404, `Quotation with id "${quotationId}" not found.`);
  }
  if (quotation.status !== "AWARDED") {
    throw new ApiError(
      400,
      `A PO can only be raised against an AWARDED quotation. Current status: "${quotation.status}".`
    );
  }

  // ── Idempotency guard — one PO per quotation ─────────────────────────────────
  const existingPO = await prisma.purchaseOrder.findUnique({
    where: { quotationId },
  });
  if (existingPO) {
    throw new ApiError(
      409,
      `A Purchase Order (${existingPO.poNumber}) already exists for this quotation.`
    );
  }

  // ── Sequential PO number ─────────────────────────────────────────────────────
  const count = await prisma.purchaseOrder.count();
  const poNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      lineItems:   quotation.lineItems,   // carry forward agreed line items verbatim
      totalAmount: quotation.totalAmount,
      currency:    quotation.currency,
      status:      "DRAFT",
      deliveryAddress: {
        street:  deliveryAddress.street,
        city:    deliveryAddress.city,
        state:   deliveryAddress.state,
        country: deliveryAddress.country,
        zipCode: deliveryAddress.zipCode,
      },
      expectedDeliveryDate: expectedDeliveryDate
        ? new Date(expectedDeliveryDate)
        : null,
      quotationId,
      creatorId: req.user.id,
    },
    include: {
      quotation: {
        select: {
          id:             true,
          quotationNumber: true,
          vendor:         { select: { id: true, companyName: true, email: true } },
          rfq:            { select: { id: true, rfqNumber: true, title: true } },
        },
      },
    },
  });

  sendSuccess(res, po, "Purchase Order created successfully.", 201);
};

// ── Get All Purchase Orders ────────────────────────────────────────────────────
// GET /api/purchase-orders
// Access: Vendors see only their own POs. Internal users see all.

export const getPOs = async (req, res) => {
  const isVendor = req.userType === "VENDOR";

  // Vendors filter by vendorId via the nested quotation relation
  const where = isVendor
    ? { quotation: { vendorId: req.vendor.id } }
    : {};

  // Optional filters for internal users
  if (!isVendor) {
    if (req.query.status) where.status = req.query.status;
  }

  const pos = await prisma.purchaseOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id:                  true,
      poNumber:            true,
      totalAmount:         true,
      currency:            true,
      status:              true,
      issuedAt:            true,
      expectedDeliveryDate: true,
      createdAt:           true,
      quotation: {
        select: {
          id:              true,
          quotationNumber: true,
          vendor: {
            select: { id: true, companyName: true, isVerified: true },
          },
          rfq: {
            select: { id: true, rfqNumber: true, title: true },
          },
        },
      },
      creator: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  sendSuccess(res, pos, `${pos.length} Purchase Order(s) fetched successfully.`);
};

// ── Get Purchase Order By ID ───────────────────────────────────────────────────
// GET /api/purchase-orders/:id
// Access: Internal users see any PO. Vendors see only their own.

export const getPOById = async (req, res) => {
  const { id } = req.params;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      quotation: {
        include: {
          vendor: {
            select: {
              id:           true,
              companyName:  true,
              email:        true,
              rating:       true,
              isVerified:   true,
              contactPerson: true,
              address:      true,
            },
          },
          rfq: {
            select: {
              id:          true,
              rfqNumber:   true,
              title:       true,
              description: true,
              category:    true,
              status:      true,
            },
          },
        },
      },
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
    },
  });

  if (!po) throw new ApiError(404, `Purchase Order with id "${id}" not found.`);

  // Vendors may only access POs that belong to them
  if (req.userType === "VENDOR" && po.quotation.vendor.id !== req.vendor.id) {
    throw new ApiError(404, `Purchase Order with id "${id}" not found.`);
  }

  sendSuccess(res, po, "Purchase Order fetched successfully.");
};

// ── Update Purchase Order Status ───────────────────────────────────────────────
// PATCH /api/purchase-orders/:id/status
// Access: ADMIN, MANAGER only.

const VALID_TRANSITIONS = {
  DRAFT:               ["ISSUED", "CANCELLED"],
  ISSUED:              ["ACKNOWLEDGED", "CANCELLED"],
  ACKNOWLEDGED:        ["PARTIALLY_FULFILLED", "FULFILLED", "CANCELLED"],
  PARTIALLY_FULFILLED: ["FULFILLED", "CANCELLED"],
  FULFILLED:           [],   // terminal
  CANCELLED:           [],   // terminal
};

export const updatePOStatus = async (req, res) => {
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

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new ApiError(404, `Purchase Order with id "${id}" not found.`);

  const allowedNext = VALID_TRANSITIONS[po.status];
  if (!allowedNext.includes(status)) {
    throw new ApiError(
      400,
      `Cannot transition PO from "${po.status}" to "${status}". ` +
      `Allowed next states: ${allowedNext.length ? allowedNext.join(", ") : "none (terminal state)"}.`
    );
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id },
    data: {
      status,
      // Stamp issuedAt the first time the PO is formally issued to the vendor
      ...(status === "ISSUED" && !po.issuedAt ? { issuedAt: new Date() } : {}),
    },
  });

  sendSuccess(res, updated, `Purchase Order status updated to "${status}" successfully.`);
};