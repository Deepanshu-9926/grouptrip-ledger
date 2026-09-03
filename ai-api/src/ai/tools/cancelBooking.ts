export const cancelBookingTool = {
  type: "function" as const,
  name: "cancel_booking",
  description:
    "Cancel an existing booking when the user asks to cancel or remove it.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      trip_id: {
        type: "string",
        description: "The ID of the trip.",
      },
      booking_title: {
        type: "string",
        description: "The name or title of the booking to cancel.",
      },
      reason: {
        type: "string",
        description: "Reason for cancelling the booking.",
      },
    },
    required: ["trip_id", "booking_title", "reason"],
    additionalProperties: false,
  },
};