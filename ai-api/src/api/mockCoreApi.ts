export async function mockCoreOperation(
  action: string,
  args: Record<string, unknown>
) {
  console.log("\n========== MOCK CORE API ==========");
  console.log("Action:", action);
  console.log("Arguments:", JSON.stringify(args, null, 2));

  switch (action) {
    case "remove_participant":
      return {
        success: true,
        action,
        message: `${args.participant_name} has been removed from the trip.`,
      };

    case "add_booking":
      return {
        success: true,
        action,
        message: `${args.title} booking has been added successfully.`,
      };

    case "cancel_booking":
      return {
        success: true,
        action,
        message: `${args.booking_title} booking has been cancelled.`,
      };

    case "log_payment":
      return {
        success: true,
        action,
        message: `Payment of ₹${args.amount} from ${args.participant_name} has been recorded.`,
      };

    default:
      return {
        success: false,
        action,
        message: "Unsupported operation.",
      };
  }
}