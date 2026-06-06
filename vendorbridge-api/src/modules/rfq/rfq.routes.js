import { Router } from "express";
import { protect, restrictTo } from '../../middleware/auth.middleware.js';
import {
  createRFQ,
  getAllRFQs,
  getRFQById,
  updateRFQStatus,
} from "./rfq.controllers.js";

const router = Router();

// All RFQ routes require a valid JWT
router.use(protect);

// POST   /api/rfqs          — Create a new RFQ (internal users only)
router.post(
  "/",
  restrictTo("ADMIN", "MANAGER", "PROCUREMENT_OFFICER"),
  createRFQ
);

// GET    /api/rfqs          — List all RFQs (vendors see PUBLISHED only)
router.get("/", getAllRFQs);

// GET    /api/rfqs/:id      — Fetch a single RFQ with creator details
router.get("/:id", getRFQById);

// PATCH  /api/rfqs/:id/status — Advance RFQ through the workflow
router.patch(
  "/:id/status",
  restrictTo("ADMIN", "MANAGER"),
  updateRFQStatus
);

export default router;