import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

// ── Create RFQ ─────────────────────────────────────────────────────────────────
// POST /api/rfqs
// Access: Internal users only (ADMIN, MANAGER, PROCUREMENT_OFFICER)

export const createRFQ = async (req, res) => {
  const {
    title,
    description,
    category,
    lineItems,
    submissionDeadline,
    deliveryDeadline,
    termsConditions,
  } = req.body;

  if (!title || !description || !category || !submissionDeadline || !deliveryDeadline) {
    throw new ApiError(
      400,
      "title, description, category, submissionDeadline, and deliveryDeadline are required."
    );
  }

  if (!Array.isArray(lineItems) || lineItems.length === 0) {
    throw new ApiError(400, "At least one lineItem is required.");
  }

  // Validate each embedded LineItem matches the Prisma type shape
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

  // Generate a sequential, human-readable RFQ number
  const count = await prisma.rFQ.count();
  const rfqNumber = `RFQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const rfq = await prisma.rFQ.create({
    data: {
      rfqNumber,
      title,
      description,
      category,
      lineItems,
      submissionDeadline: new Date(submissionDeadline),
      deliveryDeadline:   new Date(deliveryDeadline),
      termsConditions:    termsConditions ?? null,
      status:             "DRAFT",
      creatorId:          req.user.id,
    },
  });

  sendSuccess(res, rfq, "RFQ created successfully.", 201);
};

// ── Get All RFQs ───────────────────────────────────────────────────────────────
// GET /api/rfqs
// Access: All authenticated users.
//         Vendors → PUBLISHED only. Internal users → all statuses.

export const getAllRFQs = async (req, res) => {
  const isVendor = req.userType === "VENDOR";

  // Vendors only see published RFQs that are still open for submission
  const where = isVendor ? { status: "PUBLISHED" } : {};

  // Optional filters for internal users
  if (!isVendor) {
    if (req.query.status)   where.status   = req.query.status;
    if (req.query.category) where.category = req.query.category;
  }

  const rfqs = await prisma.rFQ.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id:                 true,
      rfqNumber:          true,
      title:              true,
      category:           true,
      status:             true,
      submissionDeadline: true,
      deliveryDeadline:   true,
      createdAt:          true,
      // Surface creator summary without exposing passwordHash
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      // Count competing quotes without exposing their details to vendors
      _count: { select: { quotations: true } },
    },
  });

  sendSuccess(res, rfqs, "RFQs fetched successfully.");
};

// ── Get RFQ By ID ──────────────────────────────────────────────────────────────
// GET /api/rfqs/:id
// Access: All authenticated users.
//         Vendors are gate-kept to PUBLISHED RFQs only.

export const getRFQById = async (req, res) => {
  const { id } = req.params;

  const rfq = await prisma.rFQ.findUnique({
    where: { id },
    include: {
      creator: {
        select: { id: true, firstName: true, lastName: true, email: true, role: true },
      },
      _count: { select: { quotations: true } },
    },
  });

  if (!rfq) throw new ApiError(404, `RFQ with id "${id}" not found.`);

  // Vendors must not be able to probe non-published RFQs by guessing IDs
  if (req.userType === "VENDOR" && rfq.status !== "PUBLISHED") {
    throw new ApiError(404, `RFQ with id "${id}" not found.`);
  }

  sendSuccess(res, rfq, "RFQ fetched successfully.");
};

// ── Update RFQ Status ──────────────────────────────────────────────────────────
// PATCH /api/rfqs/:id/status
// Access: ADMIN, MANAGER only.
// Valid transitions enforced — prevents arbitrary status jumps mid-workflow.

const VALID_TRANSITIONS = {
  DRAFT:     ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["CLOSED", "CANCELLED"],
  CLOSED:    ["AWARDED", "CANCELLED"],
  AWARDED:   [],   // terminal
  CANCELLED: [],   // terminal
};

export const updateRFQStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const ALLOWED_STATUSES = ["DRAFT", "PUBLISHED", "CLOSED", "AWARDED", "CANCELLED"];

  if (!status) throw new ApiError(400, "status is required in the request body.");
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(400, `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}.`);
  }

  const rfq = await prisma.rFQ.findUnique({ where: { id } });
  if (!rfq) throw new ApiError(404, `RFQ with id "${id}" not found.`);

  const allowedNext = VALID_TRANSITIONS[rfq.status];
  if (!allowedNext.includes(status)) {
    throw new ApiError(
      400,
      `Cannot transition RFQ from "${rfq.status}" to "${status}". ` +
      `Allowed next states: ${allowedNext.length ? allowedNext.join(", ") : "none (terminal state)"}.`
    );
  }

  const updated = await prisma.rFQ.update({
    where: { id },
    data: {
      status,
      // Stamp publishedAt the first time an RFQ goes live
      ...(status === "PUBLISHED" && !rfq.publishedAt ? { publishedAt: new Date() } : {}),
    },
  });

  sendSuccess(res, updated, `RFQ status updated to "${status}" successfully.`);
};