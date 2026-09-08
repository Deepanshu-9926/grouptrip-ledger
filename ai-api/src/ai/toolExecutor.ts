import { get, post, del } from "../api/coreApiClient.js";

interface Participant {
  id: string;
  name: string;
}

interface Booking {
  id: string;
  vendor_name: string;
}

async function getParticipants(tripId: string): Promise<Participant[]> {
  const result = await get<{ data: Participant[] }>(`/api/trips/${tripId}/participants`);
  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch participants");
  }
  return result.data.data;
}

async function getBookings(tripId: string): Promise<Booking[]> {
  const result = await get<{ data: Booking[] }>(`/api/trips/${tripId}/bookings`);
  if (!result.success || !result.data) {
    throw new Error(result.error || "Failed to fetch bookings");
  }
  return result.data.data;
}

function resolveEntity<T extends { name?: string; vendor_name?: string }>(
  entities: T[],
  searchName: string,
  nameField: "name" | "vendor_name"
): T[] {
  const normalizedSearch = searchName.trim().toLowerCase();
  return entities.filter(
    (e) => (e[nameField] as string).trim().toLowerCase() === normalizedSearch
  );
}

export async function executeTool(
  action: string,
  args: Record<string, unknown>
): Promise<{ success: boolean; action: string; message: string }> {
  try {
    const tripId = args.trip_id as string;
    if (!tripId) {
      return { success: false, action, message: "Missing trip_id" };
    }

    if (action === "remove_participant") {
      const participantName = args.participant_name as string;
      const bookingTitle = args.booking_title as string;

      const [participants, bookings] = await Promise.all([
        getParticipants(tripId),
        getBookings(tripId),
      ]);

      const matchedParticipants = resolveEntity(participants, participantName, "name");
      if (matchedParticipants.length !== 1) {
        return {
          success: false,
          action,
          message: `Could not uniquely resolve participant "${participantName}". Found ${matchedParticipants.length} matches. Please ask the user to clarify.`,
        };
      }

      const matchedBookings = resolveEntity(bookings, bookingTitle, "vendor_name");
      if (matchedBookings.length !== 1) {
        return {
          success: false,
          action,
          message: `Could not uniquely resolve booking "${bookingTitle}". Found ${matchedBookings.length} matches. Please ask the user to clarify.`,
        };
      }

      const res = await del(
        `/api/bookings/${matchedBookings[0].id}/participants/${matchedParticipants[0].id}`
      );
      if (!res.success) {
        return { success: false, action, message: `Backend error: ${res.error}` };
      }
      return {
        success: true,
        action,
        message: `Removed ${participantName} from ${bookingTitle} successfully.`,
      };
    }

    if (action === "add_booking") {
      const category = args.booking_type as string;
      const vendorName = args.title as string;
      const totalCost = args.amount as number;
      const bookingDatetime = args.booking_datetime as string;
      const participantNames = args.participant_names as string[];

      // Resolve participants first
      const allParticipants = await getParticipants(tripId);
      const resolvedParticipantIds: string[] = [];

      for (const name of participantNames) {
        const matches = resolveEntity(allParticipants, name, "name");
        if (matches.length !== 1) {
          return {
            success: false,
            action,
            message: `Could not uniquely resolve participant "${name}" (found ${matches.length} matches). Please ask the user to clarify before adding the booking.`,
          };
        }
        resolvedParticipantIds.push(matches[0].id);
      }

      // Create booking
      const createRes = await post<{ data: Booking }>(`/api/trips/${tripId}/bookings`, {
        category,
        vendor_name: vendorName,
        total_cost: totalCost,
        booking_datetime: bookingDatetime,
      });

      if (!createRes.success || !createRes.data) {
        return { success: false, action, message: `Failed to create booking: ${createRes.error}` };
      }

      const bookingId = createRes.data.data.id;

      // Attach participants
      for (const pId of resolvedParticipantIds) {
        const attachRes = await post(`/api/bookings/${bookingId}/participants`, {
          participant_id: pId,
        });
        if (!attachRes.success) {
          return {
            success: false,
            action,
            message: `Booking created but failed to attach a participant: ${attachRes.error}`,
          };
        }
      }

      return {
        success: true,
        action,
        message: `Booking for ${vendorName} added successfully with ${participantNames.length} participants.`,
      };
    }

    if (action === "cancel_booking") {
      const bookingTitle = args.booking_title as string;
      const bookings = await getBookings(tripId);
      
      const matchedBookings = resolveEntity(bookings, bookingTitle, "vendor_name");
      if (matchedBookings.length !== 1) {
        return {
          success: false,
          action,
          message: `Could not uniquely resolve booking "${bookingTitle}". Found ${matchedBookings.length} matches. Please ask the user to clarify.`,
        };
      }

      const res = await post(`/api/bookings/${matchedBookings[0].id}/cancel`);
      if (!res.success) {
        return { success: false, action, message: `Failed to cancel booking: ${res.error}` };
      }

      return {
        success: true,
        action,
        message: `Booking ${bookingTitle} has been cancelled successfully.`,
      };
    }

    if (action === "log_payment") {
      const participantName = args.participant_name as string;
      const bookingTitle = args.booking_title as string;
      const amount = args.amount as number;

      const [participants, bookings] = await Promise.all([
        getParticipants(tripId),
        getBookings(tripId),
      ]);

      const matchedParticipants = resolveEntity(participants, participantName, "name");
      if (matchedParticipants.length !== 1) {
        return {
          success: false,
          action,
          message: `Could not uniquely resolve participant "${participantName}". Found ${matchedParticipants.length} matches. Please ask the user to clarify.`,
        };
      }

      const matchedBookings = resolveEntity(bookings, bookingTitle, "vendor_name");
      if (matchedBookings.length !== 1) {
        return {
          success: false,
          action,
          message: `Could not uniquely resolve booking "${bookingTitle}". Found ${matchedBookings.length} matches. Please ask the user to clarify.`,
        };
      }

      const res = await post(`/api/bookings/${matchedBookings[0].id}/payments`, {
        payer_participant_id: matchedParticipants[0].id,
        amount,
      });

      if (!res.success) {
        return { success: false, action, message: `Failed to log payment: ${res.error}` };
      }

      return {
        success: true,
        action,
        message: `Payment of ${amount} from ${participantName} for ${bookingTitle} recorded successfully.`,
      };
    }

    return {
      success: false,
      action,
      message: `Unsupported operation: ${action}`,
    };
  } catch (err) {
    return {
      success: false,
      action,
      message: `Internal executor error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}