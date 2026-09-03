import "dotenv/config";
import express from "express";
import cors from "cors";
import aiRoutes from "./api/ai.routes.js";
import vendorRoutes from "./vendor/vendor.routes.js";

const app = express();
const PORT = Number(process.env.AI_API_PORT) || 8100;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "grouptrip-ai-api",
    status: "healthy",
  });
});

app.use("/ai", aiRoutes);
app.use("/vendor", vendorRoutes);

app.listen(PORT, () => {
  console.log(`AI API running on http://localhost:${PORT}`);
});