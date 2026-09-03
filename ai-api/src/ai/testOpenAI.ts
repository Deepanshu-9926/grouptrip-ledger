import "dotenv/config";
import { openai } from "./openai.js";

async function testOpenAI() {
  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      input: "Say exactly: GroupTrip Ledger AI is connected.",
    });

    console.log("OpenAI response:");
    console.log(response.output_text);
  } catch (error) {
    console.error("OpenAI connection failed:");
    console.error(error);
    process.exit(1);
  }
}

testOpenAI();