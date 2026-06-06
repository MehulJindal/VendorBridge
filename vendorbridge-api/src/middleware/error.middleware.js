import { ApiError } from "../utils/ApiError.js";

export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Prisma not-found
  if (err.code === "P2025") {
    return res.status(404).json({ success: false, message: "Resource not found." });
  }

  return res.status(500).json({ success: false, message: "Internal Server Error" });
};