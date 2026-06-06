import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { getAllVendors, getVendorById, updateVendorStatus } from "./vendor.controllers.js";

const router = Router();

// All vendor directory routes require a valid JWT
router.use(protect);

// Shared role set for read-only access — extracted to avoid repetition
const READERS = ["ADMIN", "MANAGER", "PROCUREMENT_OFFICER", "USER"];

// GET    /api/vendors          — Paginated, filterable vendor directory
router.get("/", restrictTo(...READERS), getAllVendors);

// GET    /api/vendors/:id      — Full vendor profile with recent quotations and POs
router.get("/:id", restrictTo(...READERS), getVendorById);

// PATCH  /api/vendors/:id/status — Verify, activate, deactivate, or blacklist a vendor
router.patch(
  "/:id/status",
  restrictTo("ADMIN", "MANAGER"),
  updateVendorStatus
);

export default router;