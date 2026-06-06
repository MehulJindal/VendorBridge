import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

// ── Entity registry ────────────────────────────────────────────────────────────
// Maps entityType strings to their Prisma delegate and a human-readable label.
// Add new approvable document types here without touching controller logic.

const ENTITY_REGISTRY = {
  PO: {
    label:  "Purchase Order",
    finder: (id) =>
      prisma.purchaseOrder.findUnique({
        where:  { id },
        select: { id: true, poNumber: true, status: true },
      }),
  },
  INVOICE: {
    label:  "Invoice",
    finder: (id) =>
      prisma.invoice.findUnique({
        where:  { id },
        select: { id: true, invoiceNumber: true, status: true },
      }),
  },
  RFQ: {
    label:  "RFQ",
    finder: (id) =>
      prisma.rFQ.findUnique({
        where:  { id },
        select: { id: true, rfqNumber: true, status: true },
      }),
  },
};

// ── Create Approval Request ────────────────────────────────────────────────────
// POST /api/approvals/request
// Access: ADMIN, MANAGER, PROCUREMENT_OFFICER.
// Creates a PENDING approval record tied to any registered entity type.

export const createApprovalRequest = async (req, res) => {
  const { entityType, entityId, approverId, comments } = req.body;

  if (!entityType || !entityId || !approverId) {
    throw new ApiError(400, "entityType, entityId, and approverId are required.");
  }

  // Validate entityType against the registry
  const registryEntry = ENTITY_REGISTRY[entityType.toUpperCase()];
  if (!registryEntry) {
    throw new ApiError(
      400,
      `Invalid entityType "${entityType}". Must be one of: ${Object.keys(ENTITY_REGISTRY).join(", ")}.`
    );
  }

  // Confirm the referenced document actually exists
  const entity = await registryEntry.finder(entityId);
  if (!entity) {
    throw new ApiError(
      404,
      `${registryEntry.label} with id "${entityId}" not found.`
    );
  }

  // Confirm the designated approver exists and is an active internal user
  const approver = await prisma.user.findUnique({
    where:  { id: approverId },
    select: { id: true, firstName: true, lastName: true, role: true, isActive: true },
  });

  if (!approver) {
    throw new ApiError(404, `Approver user with id "${approverId}" not found.`);
  }
  if (!approver.isActive) {
    throw new ApiError(400, `Approver "${approver.firstName} ${approver.lastName}" is deactivated.`);
  }

  // Idempotency — prevent duplicate open approval requests for the same document
  const existingPending = await prisma.approval.findFirst({
    where: {
      entityType: entityType.toUpperCase(),
      entityId,
      status: "PENDING",
    },
  });
  if (existingPending) {
    throw new ApiError(
      409,
      `A PENDING approval request already exists for this ${registryEntry.label} (approval id: ${existingPending.id}).`
    );
  }

  const approval = await prisma.approval.create({
    data: {
      entityType:  entityType.toUpperCase(),
      entityId,
      status:      "PENDING",
      comments:    comments ?? null,
      approverId,
    },
    include: {
      approver: {
        select: { id: true, firstName: true, lastName: true, role: true, email: true },
      },
    },
  });

  sendSuccess(
    res,
    approval,
    `Approval request created for ${registryEntry.label} "${entityId}".`,
    201
  );
};

// ── Get Pending Approvals ──────────────────────────────────────────────────────
// GET /api/approvals/pending
// Access: ADMIN, MANAGER, FINANCE, PROCUREMENT_OFFICER.
// ADMIN/MANAGER see all pending approvals across the system.
// FINANCE and PROCUREMENT_OFFICER see only approvals assigned to them specifically.

export const getPendingApprovals = async (req, res) => {
  const { role, id: userId } = req.user;

  const GLOBAL_ROLES = ["ADMIN", "MANAGER"];
  const isGlobalViewer = GLOBAL_ROLES.includes(role);

  const where = {
    status: "PENDING",
    // Scoped roles only see requests explicitly assigned to them
    ...(!isGlobalViewer ? { approverId: userId } : {}),
  };

  // Optional filters available to all callers
  if (req.query.entityType) {
    where.entityType = req.query.entityType.toUpperCase();
  }

  const approvals = await prisma.approval.findMany({
    where,
    orderBy: { createdAt: "asc" },   // oldest pending requests surface first
    include: {
      approver: {
        select: { id: true, firstName: true, lastName: true, role: true },
      },
    },
  });

  // Hydrate each approval record with a snapshot of its referenced document.
  // We do this in-process to avoid a Prisma polymorphic relation limitation —
  // the Approval model uses a plain entityId string, not a typed FK per entity.
  const hydrated = await Promise.all(
    approvals.map(async (approval) => {
      const entry  = ENTITY_REGISTRY[approval.entityType];
      const entity = entry ? await entry.finder(approval.entityId) : null;
      return { ...approval, entity: entity ?? null };
    })
  );

  sendSuccess(res, hydrated, `${hydrated.length} pending approval(s) fetched successfully.`);
};

// ── Process Approval ───────────────────────────────────────────────────────────
// PATCH /api/approvals/:id/process
// Access: ADMIN, MANAGER, FINANCE.
// Transitions a PENDING approval to APPROVED or REJECTED, appends an optional
// comment, and stamps approvedAt. ESCALATED approvals are re-queued as PENDING.

const VALID_TRANSITIONS = {
  PENDING:   ["APPROVED", "REJECTED", "ESCALATED"],
  ESCALATED: ["APPROVED", "REJECTED", "PENDING"],   // re-assignable after escalation
  APPROVED:  [],   // terminal
  REJECTED:  [],   // terminal
};

export const processApproval = async (req, res) => {
  const { id }                       = req.params;
  const { status, comments, escalateTo } = req.body;

  const ALLOWED_STATUSES = Object.keys(VALID_TRANSITIONS);

  if (!status) throw new ApiError(400, "status is required in the request body.");
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new ApiError(
      400,
      `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(", ")}.`
    );
  }

  const approval = await prisma.approval.findUnique({
    where:   { id },
    include: {
      approver: { select: { id: true, firstName: true, lastName: true, role: true } },
    },
  });

  if (!approval) throw new ApiError(404, `Approval with id "${id}" not found.`);

  const allowedNext = VALID_TRANSITIONS[approval.status];
  if (!allowedNext.includes(status)) {
    throw new ApiError(
      400,
      `Cannot transition approval from "${approval.status}" to "${status}". ` +
      `Allowed next states: ${allowedNext.length ? allowedNext.join(", ") : "none (terminal state)"}.`
    );
  }

  // ── ESCALATED path — re-assign to a new approver ─────────────────────────────
  if (status === "ESCALATED") {
    if (!escalateTo) {
      throw new ApiError(400, "escalateTo (user id) is required when escalating an approval.");
    }

    const newApprover = await prisma.user.findUnique({
      where:  { id: escalateTo },
      select: { id: true, firstName: true, lastName: true, role: true, isActive: true },
    });

    if (!newApprover) {
      throw new ApiError(404, `Escalation target user with id "${escalateTo}" not found.`);
    }
    if (!newApprover.isActive) {
      throw new ApiError(
        400,
        `Escalation target "${newApprover.firstName} ${newApprover.lastName}" is deactivated.`
      );
    }
    if (escalateTo === approval.approverId) {
      throw new ApiError(400, "Cannot escalate an approval to the same approver.");
    }

    const escalated = await prisma.approval.update({
      where: { id },
      data: {
        status:     "ESCALATED",
        approverId: escalateTo,
        comments:   comments ?? approval.comments,
      },
      include: {
        approver: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    return sendSuccess(
      res,
      escalated,
      `Approval escalated to ${newApprover.firstName} ${newApprover.lastName}.`
    );
  }

  // ── APPROVED / REJECTED path — atomic: update approval + mirror on entity ────
  const registryEntry = ENTITY_REGISTRY[approval.entityType];

  const [updatedApproval] = await prisma.$transaction(async (tx) => {
    // 1. Stamp the approval record
    const processed = await tx.approval.update({
      where: { id },
      data: {
        status,
        comments:   comments ?? approval.comments,
        approvedAt: new Date(),
      },
      include: {
        approver: { select: { id: true, firstName: true, lastName: true, role: true } },
      },
    });

    // 2. Reflect the decision on the source document where applicable
    if (approval.entityType === "INVOICE") {
      const nextInvoiceStatus = status === "APPROVED" ? "APPROVED" : "CANCELLED";
      await tx.invoice.update({
        where: { id: approval.entityId },
        data:  { status: nextInvoiceStatus },
      });
    }

    if (approval.entityType === "PO") {
      // Only advance DRAFT POs on approval; leave already-issued POs untouched
      const po = await tx.purchaseOrder.findUnique({
        where:  { id: approval.entityId },
        select: { status: true },
      });
      if (po?.status === "DRAFT") {
        const nextPOStatus = status === "APPROVED" ? "ISSUED" : "CANCELLED";
        await tx.purchaseOrder.update({
          where: { id: approval.entityId },
          data:  { status: nextPOStatus, ...(status === "APPROVED" ? { issuedAt: new Date() } : {}) },
        });
      }
    }

    return [processed];
  });

  const entityLabel = registryEntry?.label ?? approval.entityType;
  sendSuccess(
    res,
    updatedApproval,
    `Approval ${status.toLowerCase()} successfully. ${entityLabel} status has been updated.`
  );
};