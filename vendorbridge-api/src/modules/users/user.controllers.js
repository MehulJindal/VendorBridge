import { prisma } from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";

// Centralised safe select — passwordHash is structurally absent from every
// response in this module. Never use findUnique/findMany without this on User.
const USER_SAFE_SELECT = {
  id:        true,
  email:     true,
  firstName: true,
  lastName:  true,
  role:      true,
  isActive:  true,
  createdAt: true,
  updatedAt: true,
};

// Valid Role enum values — mirrors schema.prisma exactly.
// Update here if the enum ever gains new members.
const VALID_ROLES = [
  "ADMIN",
  "MANAGER",
  "PROCUREMENT_OFFICER",
  "FINANCE",
];

// ── Get Me ─────────────────────────────────────────────────────────────────────
// GET /api/users/me
// Access: Any authenticated internal user.
// Returns the caller's own profile enriched with a lightweight activity summary.

export const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where:  { id: req.user.id },
    select: USER_SAFE_SELECT,
  });

  // Theoretically unreachable — protect middleware already confirmed existence —
  // but kept as a safety net against race conditions (e.g. account deleted mid-session).
  if (!user) throw new ApiError(404, "Your account no longer exists.");

  // Parallel activity counts — no sequential waterfall
  const [createdRFQs, processedApprovals, raisedPOs] = await Promise.all([
    prisma.rFQ.count({ where: { creatorId: user.id } }),
    prisma.approval.count({ where: { approverId: user.id } }),
    prisma.purchaseOrder.count({ where: { creatorId: user.id } }),
  ]);

  sendSuccess(
    res,
    {
      user,
      activity: { createdRFQs, processedApprovals, raisedPOs },
    },
    "Profile fetched successfully."
  );
};

// ── Get All Users ──────────────────────────────────────────────────────────────
// GET /api/users
// Access: ADMIN, MANAGER.
// Supports: ?role=MANAGER, ?isActive=false, ?search=jane, ?page=1, ?limit=20

export const getAllUsers = async (req, res) => {
  const where = {};

  // Role filter — validate against enum before hitting the DB
  if (req.query.role) {
    const role = req.query.role.toUpperCase();
    if (!VALID_ROLES.includes(role)) {
      throw new ApiError(
        400,
        `Invalid role filter "${req.query.role}". Must be one of: ${VALID_ROLES.join(", ")}.`
      );
    }
    where.role = role;
  }

  // Boolean coercion — query params arrive as strings
  if (req.query.isActive !== undefined) {
    where.isActive = req.query.isActive === "true";
  }

  // Partial name / email search across three fields simultaneously
  if (req.query.search) {
    where.OR = [
      { firstName: { contains: req.query.search, mode: "insensitive" } },
      { lastName:  { contains: req.query.search, mode: "insensitive" } },
      { email:     { contains: req.query.search, mode: "insensitive" } },
    ];
  }

  // Pagination — clamped server-side so clients can't dump the whole table
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select:  USER_SAFE_SELECT,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  sendSuccess(
    res,
    {
      users,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    },
    `${users.length} user(s) fetched successfully.`
  );
};

// ── Get User By ID ─────────────────────────────────────────────────────────────
// GET /api/users/:id
// Access: ADMIN, MANAGER.
// Returns full profile with a recent-activity snapshot for the staff directory.

export const getUserById = async (req, res) => {
  const { id } = req.params;

  const [user, recentRFQs, recentApprovals, recentPOs] = await Promise.all([
    prisma.user.findUnique({
      where:  { id },
      select: USER_SAFE_SELECT,
    }),

    prisma.rFQ.findMany({
      where:   { creatorId: id },
      orderBy: { createdAt: "desc" },
      take:    5,
      select: {
        id:        true,
        rfqNumber: true,
        title:     true,
        category:  true,
        status:    true,
        createdAt: true,
      },
    }),

    prisma.approval.findMany({
      where:   { approverId: id },
      orderBy: { createdAt: "desc" },
      take:    5,
      select: {
        id:         true,
        entityType: true,
        entityId:   true,
        status:     true,
        approvedAt: true,
        createdAt:  true,
      },
    }),

    prisma.purchaseOrder.findMany({
      where:   { creatorId: id },
      orderBy: { createdAt: "desc" },
      take:    5,
      select: {
        id:          true,
        poNumber:    true,
        totalAmount: true,
        currency:    true,
        status:      true,
        createdAt:   true,
      },
    }),
  ]);

  if (!user) throw new ApiError(404, `User with id "${id}" not found.`);

  // Aggregate counts from the already-fetched slices — zero extra DB round-trips
  const summary = {
    recentRFQCount:      recentRFQs.length,
    recentApprovalCount: recentApprovals.length,
    recentPOCount:       recentPOs.length,
  };

  sendSuccess(
    res,
    { user, recentRFQs, recentApprovals, recentPOs, summary },
    "User profile fetched successfully."
  );
};

// ── Update User Role ───────────────────────────────────────────────────────────
// PATCH /api/users/:id/role
// Access: ADMIN only.
// Guards: cannot demote/reassign yourself; cannot assign an invalid role.

export const updateUserRole = async (req, res) => {
  const { id }   = req.params;
  const { role } = req.body;

  if (!role) throw new ApiError(400, "role is required in the request body.");

  const normalised = role.toUpperCase();
  if (!VALID_ROLES.includes(normalised)) {
    throw new ApiError(
      400,
      `Invalid role "${role}". Must be one of: ${VALID_ROLES.join(", ")}.`
    );
  }

  // Prevent an admin from accidentally locking themselves out mid-session
  if (id === req.user.id) {
    throw new ApiError(403, "You cannot change your own role.");
  }

  const target = await prisma.user.findUnique({
    where:  { id },
    select: { id: true, firstName: true, lastName: true, role: true, isActive: true },
  });

  if (!target) throw new ApiError(404, `User with id "${id}" not found.`);
  if (!target.isActive) {
    throw new ApiError(
      400,
      `Cannot update the role of deactivated user "${target.firstName} ${target.lastName}".`
    );
  }

  // No-op guard — surfaces clearly rather than silently writing an identical row
  if (target.role === normalised) {
    throw new ApiError(
      409,
      `User "${target.firstName} ${target.lastName}" already has the role "${normalised}".`
    );
  }

  const previousRole = target.role;

  const updated = await prisma.user.update({
    where:  { id },
    data:   { role: normalised },
    select: USER_SAFE_SELECT,
  });

  sendSuccess(
    res,
    updated,
    `User "${updated.firstName} ${updated.lastName}" promoted from ${previousRole} to ${normalised}.`
  );
};