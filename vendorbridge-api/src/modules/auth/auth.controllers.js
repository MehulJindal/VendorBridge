import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {prisma} from "../../config/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { sendSuccess } from "../../utils/ApiResponse.js";
// ── Helpers ────────────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const hashPassword = (plain) => bcrypt.hash(plain, SALT_ROUNDS);

const verifyPassword = (plain, hash) => bcrypt.compare(plain, hash);

// Strip hash before sending user data to client
const sanitizeUser = ({ passwordHash, ...rest }) => rest;

// ── User Controllers ───────────────────────────────────────────────────────────

export const handleUserRegister = async (req, res) => {
  const { email, password, firstName, lastName, role } = req.body;

  if (!email || !password || !firstName || !lastName) {
    throw new ApiError(400, "email, password, firstName, and lastName are required.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(400, "An account with this email already exists.");

  // Prevent self-assigning ADMIN — only seeded or promoted by an existing ADMIN
  const safeRole = role === "ADMIN" ? "PROCUREMENT_OFFICER" : (role ?? "PROCUREMENT_OFFICER");

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName, role: safeRole },
  });

  const token = signToken({ id: user.id, email: user.email, role: user.role, type: "USER" });

  sendSuccess(res, { token, user: sanitizeUser(user) }, "User registered successfully.", 201);
};

export const handleUserLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password are required.");
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Intentionally identical error for both missing user and wrong password
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!user.isActive) throw new ApiError(403, "Your account has been deactivated.");

  const token = signToken({ id: user.id, email: user.email, role: user.role, type: "USER" });

  sendSuccess(res, { token, user: sanitizeUser(user) }, "Login successful.");
};

// ── Vendor Controllers ─────────────────────────────────────────────────────────

export const handleVendorRegister = async (req, res) => {
  const {
    companyName,
    registrationNo,
    email,
    password,
    categories,
    contactPerson, // { name, email, phone? }
    address,       // { street, city, state, country, zipCode }
  } = req.body;

  // Flat field validation
  if (!companyName || !registrationNo || !email || !password) {
    throw new ApiError(400, "companyName, registrationNo, email, and password are required.");
  }

  // Nested object validation — mirrors Prisma embedded types exactly
  if (!contactPerson?.name || !contactPerson?.email) {
    throw new ApiError(400, "contactPerson must include at least name and email.");
  }

  const requiredAddressFields = ["street", "city", "state", "country", "zipCode"];
  const missingAddress = requiredAddressFields.filter((f) => !address?.[f]);
  if (missingAddress.length) {
    throw new ApiError(400, `address is missing required fields: ${missingAddress.join(", ")}.`);
  }

  const [emailTaken, regNoTaken] = await Promise.all([
    prisma.vendor.findUnique({ where: { email } }),
    prisma.vendor.findUnique({ where: { registrationNo } }),
  ]);

  if (emailTaken)  throw new ApiError(400, "A vendor with this email already exists.");
  if (regNoTaken)  throw new ApiError(400, "A vendor with this registration number already exists.");

  const passwordHash = await hashPassword(password);

  const vendor = await prisma.vendor.create({
    data: {
      companyName,
      registrationNo,
      email,
      passwordHash,
      categories: categories ?? [],
      // Prisma embedded types — no @relation, just nested objects
      contactPerson: {
        name:  contactPerson.name,
        email: contactPerson.email,
        phone: contactPerson.phone ?? null,
      },
      address: {
        street:  address.street,
        city:    address.city,
        state:   address.state,
        country: address.country,
        zipCode: address.zipCode,
      },
    },
  });

  const token = signToken({
    id: vendor.id,
    email: vendor.email,
    companyName: vendor.companyName,
    type: "VENDOR",
  });

  sendSuccess(res, { token, vendor: sanitizeUser(vendor) }, "Vendor registered successfully.", 201);
};

export const handleVendorLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password are required.");
  }

  const vendor = await prisma.vendor.findUnique({ where: { email } });

  if (!vendor || !(await verifyPassword(password, vendor.passwordHash))) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (!vendor.isActive) throw new ApiError(403, "This vendor account has been deactivated.");

  const token = signToken({
    id: vendor.id,
    email: vendor.email,
    companyName: vendor.companyName,
    type: "VENDOR",
  });

  sendSuccess(res, { token, vendor: sanitizeUser(vendor) }, "Login successful.");
};