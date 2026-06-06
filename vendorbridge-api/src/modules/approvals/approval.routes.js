import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { createApprovalRequest, getPendingApprovals, processApproval } from "./approval.controllers.js";

const router = Router();

// All approval routes require a valid JWT
router.use(protect);

// POST   /api/approvals/request        — Raise an approval request against any document
router.post(
  "/request",
  restrictTo("ADMIN", "MANAGER", "PROCUREMENT_OFFICER"),
  createApprovalRequest
);

// GET    /api/approvals/pending        — Fetch the approval queue for the caller's role
router.get(
  "/pending",
  restrictTo("ADMIN", "MANAGER", "FINANCE", "PROCUREMENT_OFFICER"),
  getPendingApprovals
);

// PATCH  /api/approvals/:id/process    — Approve, reject, or escalate a pending request
router.patch(
  "/:id/process",
  restrictTo("ADMIN", "MANAGER", "FINANCE"),
  processApproval
);

export default router;