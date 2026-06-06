import { Router } from "express";
import { protect, restrictTo } from '../../middleware/auth.middleware.js';
import {
  submitQuotation,
  getQuotationsForRFQ,
  updateQuotationStatus,
} from "./quotation.controllers.js";

const router = Router();

// All quotation routes require a valid JWT
router.use(protect);

// POST   /api/quotations/rfq/:rfqId  — Vendor submits a bid on a published RFQ
router.post(
  "/rfq/:rfqId",
  restrictTo("VENDOR"),
  submitQuotation
);

// GET    /api/quotations/rfq/:rfqId  — Internal users see all bids; vendors see their own
router.get("/rfq/:rfqId", getQuotationsForRFQ);

// PATCH  /api/quotations/:id/status  — Advance a quotation through the review workflow
router.patch(
  "/:id/status",
  restrictTo("ADMIN", "MANAGER"),
  updateQuotationStatus
);

export default router;