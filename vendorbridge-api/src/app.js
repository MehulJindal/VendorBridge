import "express-async-errors";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.middleware.js";

// ── Route Imports  ──
import authRoutes from './modules/auth/auth.routes.js';
import rfqRoutes from "./modules/rfq/rfq.routes.js";
import quotationRoutes from "./modules/quotations/quotation.routes.js";
import purchaseOrderRoutes from "./modules/purchase_orders/purchaseOrder.routes.js";
import invoiceRoutes from "./modules/invoices/invoice.routes.js";
import approvalRoutes from "./modules/approvals/approval.routes.js";
import vendorRoutes from "./modules/vendors/vendor.routes.js";
import userRoutes from "./modules/users/user.routes.js";

const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// ── Health Check ───────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "VendorBridge API",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
 app.use("/api/auth", authRoutes);
 app.use("/api/rfqs", rfqRoutes);
 app.use("/api/quotations", quotationRoutes);
 app.use("/api/purchase-orders", purchaseOrderRoutes);
 app.use("/api/invoices", invoiceRoutes);
 app.use("/api/approvals", approvalRoutes);
 app.use("/api/vendors", vendorRoutes);
 app.use("/api/users", userRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.path} not found.` });
});

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use(errorHandler);

export default app;