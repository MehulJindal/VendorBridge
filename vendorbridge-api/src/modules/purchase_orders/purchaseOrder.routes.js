import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { createPO, getPOs, getPOById, updatePOStatus } from "./purchaseOrder.controllers.js";

const router = Router();

// All PO routes require a valid JWT
router.use(protect);

// POST   /api/purchase-orders          — Raise a PO against an awarded quotation
router.post(
  "/",
  restrictTo("ADMIN", "MANAGER"),
  createPO
);

// GET    /api/purchase-orders          — List POs (vendors see their own; internal see all)
router.get("/", getPOs);

// GET    /api/purchase-orders/:id      — Full PO detail with vendor and RFQ context
router.get("/:id", getPOById);

// PATCH  /api/purchase-orders/:id/status — Advance PO through the fulfilment workflow
router.patch(
  "/:id/status",
  restrictTo("ADMIN", "MANAGER"),
  updatePOStatus
);

export default router;