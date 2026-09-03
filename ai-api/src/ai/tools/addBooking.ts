export const addBookingTool = {
  type: "function" as const,
  name: "add_booking",
  description:
    "Add a booking to the trip itinerary when the user provides booking details.",
  strict: true,
  parameters: {
    type: "object",
    properties: {
      trip_id: {
        type: "string",
        description: "The ID of the trip.",
      },
      booking_type: {
        type: "string",
        enum: ["Transport", "Accommodation", "Activities", "Other"],
        description: "The category of the booking.",
      },
      title: {
        type: "string",
        description: "Name or title of the booking.",
      },
      amount: {
        type: "number",
        description: "Total booking amount.",
      },
      participant_names: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Participants associated with the booking.",
      },
    },
    required: [
      "trip_id",
      "booking_type",
      "title",
      "amount",
      "participant_names",
    ],
    additionalProperties: false,
  },
};