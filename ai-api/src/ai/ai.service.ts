import { openai } from "./openai.js";
import { getAISystemPrompt } from "./prompts/systemPrompt.js";

import { removeParticipantTool } from "./tools/removeParticipant.js";
import { addBookingTool } from "./tools/addBooking.js";
import { cancelBookingTool } from "./tools/cancelBooking.js";
import { logPaymentTool } from "./tools/logPayment.js";

import { executeTool } from "./toolExecutor.js";

export type LanguagePreference = "en" | "hi";

export const LANGUAGE_PREFERENCE_MESSAGE =
  "Please choose your language before continuing: English (en) or Hindi (hi).";
export type IntentHint =
  | "remove_participant"
  | "add_booking"
  | "cancel_booking"
  | "log_payment";

function getOperationMessage(
  language: LanguagePreference,
  action: string,
  args: Record<string, unknown>,
  fallbackMessage: string
): string {
  if (language === "en") {
    return fallbackMessage;
  }

  switch (action) {
    case "remove_participant":
      return `${String(args.participant_name)} को ट्रिप से हटा दिया गया है।`;
    case "add_booking":
      return `${String(args.title)} बुकिंग सफलतापूर्वक जोड़ दी गई है।`;
    case "cancel_booking":
      return `${String(args.booking_title)} बुकिंग रद्द कर दी गई है।`;
    case "log_payment":
      return `${String(args.participant_name)} का ₹${String(args.amount)} भुगतान दर्ज कर दिया गया है।`;
    default:
      return fallbackMessage;
  }
}

function detectIntentHint(message: string): IntentHint | undefined {
  const normalizedMessage = message.toLocaleLowerCase();

  if (
    /बुकिंग\s*(रद्द|कैंसल)|रद्द\s*कर\s*दो|कैंसल\s*कर\s*दो|\bcancel\b|\bcancel\s+kar\s+do\b/.test(
      normalizedMessage
    )
  ) {
    return "cancel_booking";
  }

  if (
    /जा\s*रहा\s*है|जा\s*रही\s*है|छोड़\s*रहा\s*है|छोड़\s*रही\s*है|हटा\s*दो|निकाल\s*दो|\b(leaving|remove|removing)\b|\b(hata|nikal)\s+do\b/.test(
      normalizedMessage
    )
  ) {
    return "remove_participant";
  }

  if (
    /बुकिंग\s*(जोड़ो|जोड़\s*दो|कर\s*दो)|बुक\s*करो|\bbooking\s+(add|jodo|karo)\b|\badd\s+(a\s+)?booking\b/.test(
      normalizedMessage
    )
  ) {
    return "add_booking";
  }

  if (
    /पैसे\s*दिए|भुगतान\s*किया|रुपये\s*दिए|पेमेंट\s*किया|\bpaise\s+diye\b|\bpayment\s+kiya\b|\bpaid\b|\bpayment\b/.test(
      normalizedMessage
    )
  ) {
    return "log_payment";
  }

  return undefined;
}

function isNonEnglishInput(message: string): boolean {
  return /[\u0900-\u097f]/.test(message) ||
    /\b(hata do|nikal do|booking jodo|booking karo|cancel kar do|paise diye|payment kiya)\b/i.test(
      message
    );
}

function hasValidBookingArguments(args: Record<string, unknown>): boolean {
  const title = args.title;
  const amount = args.amount;
  const participantNames = args.participant_names;

  return (
    typeof title === "string" &&
    title.trim().length > 0 &&
    typeof amount === "number" &&
    Number.isFinite(amount) &&
    amount > 0 &&
    Array.isArray(participantNames) &&
    participantNames.length > 0 &&
    participantNames.every(
      (participantName) =>
        typeof participantName === "string" && participantName.trim().length > 0
    )
  );
}

async function normalizeNonEnglishRequest(
  message: string
): Promise<string> {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
    instructions: `
Convert the user's Hindi Devanagari, Hinglish, or mixed-language trip request
into one concise English canonical command for a second system that selects
one of four existing operations: remove_participant, add_booking,
cancel_booking, or log_payment.

Preserve participant names, hotel names, booking names, vendor names, amounts,
dates, IDs, and every other proper noun exactly as provided. Never translate,
replace, or invent them. Preserve the actual intent and all available details.
Do not fill in missing information. If the request is unsupported, incomplete,
or ambiguous, state that clearly instead of inventing a command. Do not call
tools or perform any operation.
`,
    input: message,
  });

  return response.output_text?.trim() || message;
}

export async function processAICommand(
  tripId: string,
  message: string,
  language?: LanguagePreference
) {
  if (!language) {
    return {
      success: false,
      action: null,
      arguments: null,
      executed: false,
      message: LANGUAGE_PREFERENCE_MESSAGE,
    };
  }

  const originalMessage = message;
  const normalizedMessage = isNonEnglishInput(message)
    ? await normalizeNonEnglishRequest(message)
    : message;
  const intentHint = detectIntentHint(originalMessage);
  const intentHintInstruction = intentHint
    ? `Detected operation intent: ${intentHint}`
    : "";

  console.log("Original request:", originalMessage);
  console.log("Normalized request:", normalizedMessage);
  console.log("Detected operation intent:", intentHint ?? "none");

  const toolChoice = intentHint
    ? { type: "function" as const, name: intentHint }
    : "auto" as const;

  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-5.6-luna",

    instructions: getAISystemPrompt(language),

    tool_choice: toolChoice,

    input: `
Trip ID: ${tripId}
Preferred response language: ${language === "hi" ? "Hindi (Devanagari)" : "English"}

Decision protocol:
- If the request clearly matches one supported operation and all required
  information can be extracted, call exactly that tool now.
- Hindi Devanagari and Hinglish requests follow the same operation mapping as
  English requests. For example, a person "ट्रिप से जा रहा है" is leaving and
  requires remove_participant, not a text-only response.
- If the request is unsupported or required information is missing or
  ambiguous, do not call a tool; ask a concise clarification question.
${intentHintInstruction}

User request:
${normalizedMessage}
`,

    tools: [
      removeParticipantTool,
      addBookingTool,
      cancelBookingTool,
      logPaymentTool,
    ],
  });

  const functionCall = response.output.find(
    (item) => item.type === "function_call"
  );

  if (!functionCall || functionCall.type !== "function_call") {
    return {
      success: true,
      action: null,
      arguments: null,
      executed: false,
      message:
        response.output_text ||
        (language === "hi"
          ? "मैं इस अनुरोध के लिए कोई समर्थित कार्रवाई नहीं पहचान सका।"
          : "I couldn't identify a supported trip operation."),
    };
  }

  const args = JSON.parse(functionCall.arguments);

  if (
    functionCall.name === "add_booking" &&
    !hasValidBookingArguments(args)
  ) {
    return {
      success: true,
      action: functionCall.name,
      arguments: args,
      executed: false,
      message:
        language === "hi"
          ? "बुकिंग जोड़ने के लिए शीर्षक, 0 से अधिक राशि और कम से कम एक प्रतिभागी का नाम बताएं।"
          : "Please provide a booking title, an amount greater than 0, and at least one participant name.",
    };
  }

  const executionResult = await executeTool(
    functionCall.name,
    args
  );

  return {
    success: executionResult.success,
    action: functionCall.name,
    arguments: args,
    executed: true,
    message: getOperationMessage(
      language,
      functionCall.name,
      args,
      executionResult.message
    ),
  };
}