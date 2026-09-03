import { Router } from "express";
import {
  LANGUAGE_PREFERENCE_MESSAGE,
  processAICommand,
  type LanguagePreference,
} from "../ai/ai.service.js";

const router = Router();

interface AICommandRequestBody {
  tripId?: unknown;
  message?: unknown;
  language?: unknown;
}

router.post("/command", async (req, res) => {
  try {
    const { tripId, message, language } = req.body as AICommandRequestBody;

    if (!tripId || !message) {
      return res.status(400).json({
        success: false,
        error: "tripId and message are required",
      });
    }

    if (language !== undefined && language !== "en" && language !== "hi") {
      return res.status(400).json({
        success: false,
        error: 'language must be "en" or "hi"',
      });
    }

    if (language === undefined) {
      return res.json({
        success: false,
        action: null,
        arguments: null,
        executed: false,
        message: LANGUAGE_PREFERENCE_MESSAGE,
      });
    }

    const result = await processAICommand(
      String(tripId),
      String(message),
      language as LanguagePreference
    );

    return res.json(result);
  } catch (error) {
    console.error("AI command error:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to process AI command",
    });
  }
});

export default router;