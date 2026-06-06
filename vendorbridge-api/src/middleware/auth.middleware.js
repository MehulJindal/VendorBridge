import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "No token provided. Authorization denied.");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired

  // Determine entity type from token payload and fetch fresh record
  if (decoded.type === "VENDOR") {
    const vendor = await prisma.vendor.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, companyName: true, isActive: true, isVerified: true },
    });

    if (!vendor)        throw new ApiError(401, "Vendor account no longer exists.");
    if (!vendor.isActive) throw new ApiError(403, "Vendor account is deactivated.");

    req.vendor = vendor;
    req.userType = "VENDOR";
  } else {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user)        throw new ApiError(401, "User account no longer exists.");
    if (!user.isActive) throw new ApiError(403, "User account is deactivated.");

    req.user = user;
    req.userType = "USER";
  }

  next();
};

// Usage: restrictTo("ADMIN", "MANAGER")
// Usage: restrictTo("VENDOR")  — pass "VENDOR" to gate vendor-only routes
export const restrictTo = (...roles) => (req, res, next) => {
  // For vendor-only routes
  if (roles.includes("VENDOR")) {
    if (req.userType !== "VENDOR") {
      throw new ApiError(403, "This route is restricted to vendors.");
    }
    return next();
  }

  // For user role-based routes
  if (req.userType !== "USER" || !roles.includes(req.user.role)) {
    throw new ApiError(
      403,
      `Access denied. Required roles: ${roles.join(", ")}.`
    );
  }

  next();
};