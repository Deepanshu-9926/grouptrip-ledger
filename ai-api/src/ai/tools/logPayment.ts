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
      booking_title: {
        type: "string",
        description: "The name or title of the booking the payment is for.",
      },
      amount: {
        type: "number",
        description: "Amount paid.",
      },
    },
    required: ["trip_id", "participant_name", "booking_title", "amount"],
    additionalProperties: false,
  },
};