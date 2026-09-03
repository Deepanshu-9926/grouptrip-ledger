import "dotenv/config";
import { processAICommand } from "./ai.service.js";

async function testCommand() {
  const tripId = "trip_demo_001";

  const message =
    process.argv.slice(2).join(" ") ||
    "Rahul is leaving after day 3";

  try {
    const response = await processAICommand(tripId, message);

    console.log("\n========== AI RESPONSE ==========\n");
    console.log("Output text:");
    console.log(response.message);
  } catch (error) {
    console.error("AI command failed:");
    console.error(error);
  }
}

testCommand();