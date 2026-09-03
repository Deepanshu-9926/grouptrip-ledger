export const removeParticipantTool = {
  type: "function" as const,
  name: "remove_participant",
  description:
    "Remove a participant from a trip when they are leaving or opting out of the trip.",
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
      reason: {
        type: "string",
        description: "Why the participant is being removed.",
      },
    },
    required: ["trip_id", "participant_name", "reason"],
    additionalProperties: false,
  },
};