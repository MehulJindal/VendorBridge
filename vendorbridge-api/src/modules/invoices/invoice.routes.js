import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { createInvoice, getInvoices, getInvoiceById, updateInvoiceStatus } from "./invoice.controllers.js";

const router = Router();

// All invoice routes require a valid JWT
router.use(protect);

// POST   /api/invoices            — Vendor submits an invoice against an acknowledged PO
router.post(
  "/",
  restrictTo("VENDOR"),
  createInvoice
);

// GET    /api/invoices            — List invoices (vendors see their own; internal see all)
router.get("/", getInvoices);

// GET    /api/invoices/:id        — Full invoice detail with PO and vendor context
router.get("/:id", getInvoiceById);

// PATCH  /api/invoices/:id/status — Advance invoice through the approval/payment workflow
router.patch(
  "/:id/status",
  restrictTo("ADMIN", "MANAGER", "FINANCE"),
  updateInvoiceStatus
);

export default router;