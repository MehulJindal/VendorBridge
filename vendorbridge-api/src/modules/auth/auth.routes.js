import { Router } from "express";
import {
  handleUserRegister,
  handleUserLogin,
  handleVendorRegister,
  handleVendorLogin,
} from "./auth.controllers.js";

const router = Router();

// ── User Auth ──────────────────────────────────────────────────────────────────
router.post("/user/register", handleUserRegister);
router.post("/user/login",    handleUserLogin);

// ── Vendor Auth ────────────────────────────────────────────────────────────────
router.post("/vendor/register", handleVendorRegister);
router.post("/vendor/login",    handleVendorLogin);

export default router;