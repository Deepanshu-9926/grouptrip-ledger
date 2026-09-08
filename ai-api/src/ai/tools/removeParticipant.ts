export const removeParticipantTool = {
  type: "function" as const,
  name: "remove_participant",
  description:
    "Remove a participant from a specific booking when they are leaving or opting out.",
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
        description: "The name of the participant who is leaving.",
      },
      booking_title: {
        type: "string",
        description: "The name or title of the booking to remove the participant from.",
      },
      reason: {
        type: "string",
        description: "Why the participant is being removed.",
      },
    },
    required: ["trip_id", "participant_name", "booking_title", "reason"],
    additionalProperties: false,
  },
};