export const logPaymentTool = {
  type: "function" as const,
  name: "log_payment",
  description:
    "Record a payment made by a participant toward a trip expense.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      trip_id: {
        type: "string",
        description: "The ID of the trip.",
      },
      participant_name: {
        type: "string",
        description: "The participant who made the payment.",
      },
      amount: {
        type: "number",
        description: "Amount paid.",
      },
      description: {
        type: "string",
        description: "What the payment was for.",
      },
    },
    required: ["trip_id", "participant_name", "amount", "description"],
    additionalProperties: false,
  },
};