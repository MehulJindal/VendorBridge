import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

// Centralised safe select — every query that returns vendor rows uses this.
// passwordHash is never present in any response from this module.
const VENDOR_SAFE_SELECT = {
  id:             true,
  companyName:    true,
  registrationNo: true,
  email:          true,
  categories:     true,
  rating:         true,
  isVerified:     true,
  isActive:       true,
  contactPerson:  true,   // embedded type — no passwordHash risk
  address:        true,   // embedded type
  createdAt:      true,
  updatedAt:      true,
};

// ── Get All Vendors ────────────────────────────────────────────────────────────
// GET /api/vendors
// Access: ADMIN, MANAGER, PROCUREMENT_OFFICER, USER (any internal role).
// Supports optional query filters: ?isVerified=true, ?isActive=false, ?category=IT

export const getAllVendors = async (req, res) => {
  const where = {};

  // Boolean coercion — query params arrive as strings
  if (req.query.isVerified !== undefined) {
    where.isVerified = req.query.isVerified === "true";
  }
  if (req.query.isActive !== undefined) {
    where.isActive = req.query.isActive === "true";
  }

  // Category filter — checks if the categories array contains the given value
  if (req.query.category) {
    where.categories = { has: req.query.category };
  }

  // Partial company name search
  if (req.query.search) {
    where.companyName = { contains: req.query.search, mode: "insensitive" };
  }

  // Pagination
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      select:  VENDOR_SAFE_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.vendor.count({ where }),
  ]);

  sendSuccess(
    res,
    {
      vendors,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
    `${vendors.length} vendor(s) fetched successfully.`
  );
};

// ── Get Vendor By ID ───────────────────────────────────────────────────────────
// GET /api/vendors/:id
// Access: ADMIN, MANAGER, PROCUREMENT_OFFICER, USER.
// Returns full vendor profile with their 10 most recent quotations and POs.

export const getVendorById = async (req, res) => {
  const { id } = req.params;

  // Run all three queries in parallel — profile + recent activity
  const [vendor, recentQuotations, recentPOs] = await Promise.all([
    prisma.vendor.findUnique({
      where:  { id },
      select: VENDOR_SAFE_SELECT,
    }),

    prisma.quotation.findMany({
      where:   { vendorId: id },
      orderBy: { submittedAt: "desc" },
      take:    10,
      select: {
        id:              true,
        quotationNumber: true,
        totalAmount:     true,
        currency:        true,
        status:          true,
        submittedAt:     true,
        rfq: {
          select: { id: true, rfqNumber: true, title: true, category: true },
        },
      },
    }),

    prisma.purchaseOrder.findMany({
      where:   { quotation: { vendorId: id } },
      orderBy: { createdAt: "desc" },
      take:    10,
      select: {
        id:          true,
        poNumber:    true,
        totalAmount: true,
        currency:    true,
        status:      true,
        issuedAt:    true,
        createdAt:   true,
        quotation: {
          select: {
            id:              true,
            quotationNumber: true,
            rfq: { select: { id: true, rfqNumber: true, title: true } },
          },
        },
      },
    }),
  ]);

  if (!vendor) throw new ApiError(404, `Vendor with id "${id}" not found.`);

  // Compute a lightweight activity summary for the profile header
  const summary = {
    totalQuotations:   recentQuotations.length,
    awardedQuotations: recentQuotations.filter((q) => q.status === "AWARDED").length,
    totalPOs:          recentPOs.length,
    activePOs:         recentPOs.filter(
      (po) => !["FULFILLED", "CANCELLED"].includes(po.status)
    ).length,
  };

  sendSuccess(
    res,
    { vendor, recentQuotations, recentPOs, summary },
    "Vendor profile fetched successfully."
  );
};

// ── Update Vendor Status ───────────────────────────────────────────────────────
// PATCH /api/vendors/:id/status
// Access: ADMIN, MANAGER only.
// Handles verification, activation/deactivation, and blacklisting.

// Allowed status actions and what they write to the vendor record
const STATUS_ACTIONS = {
  VERIFY:      { isVerified: true,  isActive: true  },
  UNVERIFY:    { isVerified: false                   },
  ACTIVATE:    { isActive:   true                    },
  DEACTIVATE:  { isActive:   false                   },
  BLACKLIST:   { isVerified: false, isActive: false  },
};

export const updateVendorStatus = async (req, res) => {
  const { id }     = req.params;
  const { action, reason } = req.body;   // action: keyof STATUS_ACTIONS

  if (!action) {
    throw new ApiError(
      400,
      `action is required. Must be one of: ${Object.keys(STATUS_ACTIONS).join(", ")}.`
    );
  }

  const update = STATUS_ACTIONS[action.toUpperCase()];
  if (!update) {
    throw new ApiError(
      400,
      `Invalid action "${action}". Must be one of: ${Object.keys(STATUS_ACTIONS).join(", ")}.`
    );
  }

  const vendor = await prisma.vendor.findUnique({
    where:  { id },
    select: { id: true, companyName: true, isVerified: true, isActive: true },
  });

  if (!vendor) throw new ApiError(404, `Vendor with id "${id}" not found.`);

  // Guard no-op transitions with a clear message
  if (action.toUpperCase() === "VERIFY" && vendor.isVerified) {
    throw new ApiError(409, `Vendor "${vendor.companyName}" is already verified.`);
  }
  if (action.toUpperCase() === "ACTIVATE" && vendor.isActive) {
    throw new ApiError(409, `Vendor "${vendor.companyName}" is already active.`);
  }
  if (
    action.toUpperCase() === "BLACKLIST" &&
    !vendor.isVerified &&
    !vendor.isActive
  ) {
    throw new ApiError(409, `Vendor "${vendor.companyName}" is already blacklisted.`);
  }

  const updated = await prisma.vendor.update({
    where:  { id },
    data:   update,
    select: VENDOR_SAFE_SELECT,
  });

  // Build a contextual message that reflects what actually changed
  const actionMessages = {
    VERIFY:     `Vendor "${updated.companyName}" has been verified and activated.`,
    UNVERIFY:   `Vendor "${updated.companyName}" verification has been revoked.`,
    ACTIVATE:   `Vendor "${updated.companyName}" has been reactivated.`,
    DEACTIVATE: `Vendor "${updated.companyName}" has been deactivated.`,
    BLACKLIST:  `Vendor "${updated.companyName}" has been blacklisted.${reason ? ` Reason: ${reason}` : ""}`,
  };

  sendSuccess(
    res,
    updated,
    actionMessages[action.toUpperCase()]
  );
};