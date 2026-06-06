import "dotenv/config";
import app from "./src/app.js";
import { prisma } from "./src/config/prisma.js";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log("✅  MongoDB connected via Prisma");

    app.listen(PORT, () => {
      console.log(`🚀  VendorBridge API running on http://localhost:${PORT}`);
      console.log(`📋  Health check: http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error("❌  Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});