import { Router } from "express";
import { getVendorLedger } from "./vendor.service.js";

const router = Router();

router.get("/:tripId", async (req, res) => {
  const { tripId } = req.params;

  if (!tripId) {
    return res.status(400).json({
      success: false,
      error: "tripId is required",
    });
  }

  try {
    return res.json(await getVendorLedger(tripId));
  } catch (error) {
    console.error("Vendor ledger error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to retrieve vendor ledger",
    });
  }
});

export default router;