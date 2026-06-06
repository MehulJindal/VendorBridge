import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware.js";
import { getMe, getAllUsers, getUserById, updateUserRole } from "./user.controllers.js";

const router = Router();

// All user routes require a valid JWT
router.use(protect);

// GET    /api/users/me       — Caller's own profile + activity summary
// Registered before /:id so Express doesn't swallow "me" as a dynamic segment
router.get("/me", getMe);

// GET    /api/users          — Paginated, filterable internal staff directory
router.get("/", restrictTo("ADMIN", "MANAGER"), getAllUsers);

// GET    /api/users/:id      — Full staff profile with recent activity snapshot
router.get("/:id", restrictTo("ADMIN", "MANAGER"), getUserById);

// PATCH  /api/users/:id/role — Promote or reassign a staff member's role
router.patch("/:id/role", restrictTo("ADMIN"), updateUserRole);

export default router;