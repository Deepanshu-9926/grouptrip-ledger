const pool = require('../db/db');

/**
 * Recomputes the current financial state of a booking by replaying its
 * full event history from the events table.
 *
 * @param {string} bookingId
 * @returns {object} {
 *   booking_id, booking_total, total_refunded, effective_booking_cost,
 *   participant_ids, shares, payments, remaining_balance
 * }
 */
async function recomputeBooking(bookingId) {
  if (!bookingId) {
    throw new Error('recomputeBooking: bookingId is required');
  }

  // 1. Fetch the booking
  const bookingResult = await pool.query(
    'SELECT * FROM bookings WHERE id = $1',
    [bookingId]
  );

  if (bookingResult.rows.length === 0) {
    throw new Error(`recomputeBooking: no booking found with id ${bookingId}`);
  }

  const booking = bookingResult.rows[0];
  const bookingTotal = Number(booking.total_cost);

  // 2. Fetch all events for this booking, replayed in strict insertion order
  const eventsResult = await pool.query(
    'SELECT * FROM events WHERE booking_id = $1 ORDER BY sequence ASC',
    [bookingId]
  );

  const events = eventsResult.rows;

  // 3. Replay events to derive current participant set, payment totals, and refunds
  const currentParticipants = new Set();
  const paymentsByParticipant = {};
  let totalRefunded = 0;

  for (const event of events) {
    const payload = event.payload || {};

    switch (event.event_type) {
      case 'participant_added_to_booking':
        currentParticipants.add(payload.participant_id);
        break;

      case 'participant_removed_from_booking':
        currentParticipants.delete(payload.participant_id);
        break;

      case 'payment_logged': {
        const payerId = payload.payer_id;
        const amount = Number(payload.amount) || 0;
        paymentsByParticipant[payerId] = (paymentsByParticipant[payerId] || 0) + amount;
        break;
      }

      case 'refund_issued': {
        const refundAmount = Number(payload.amount) || 0;
        totalRefunded += refundAmount;
        break;
      }

      case 'booking_added':
        // No financial or membership effect on its own — booking creation
        // is represented separately by participant_added_to_booking events.
        break;

      // Recognized but not yet implemented financially — ignored for now.
      case 'booking_cancelled':
      case 'booking_cost_modified':
        break;

      default:
        // Unknown event type — ignore rather than throw, so recompute
        // doesn't break on future event types added later.
        break;
    }
  }

  const participantIds = Array.from(currentParticipants);

  // 4. Effective cost after refunds — never allowed to go below zero
  const effectiveBookingCost = Math.max(0, bookingTotal - totalRefunded);

  // 5. Calculate equal shares from the effective cost, guarding against division by zero
  const shares = {};
  if (participantIds.length > 0) {
    const sharePerParticipant = effectiveBookingCost / participantIds.length;
    for (const participantId of participantIds) {
      shares[participantId] = sharePerParticipant;
    }
  }

  // 6. Total paid across all payment_logged events (unchanged from before)
  const totalPaid = Object.values(paymentsByParticipant).reduce((sum, amount) => sum + amount, 0);
  const remainingBalance = effectiveBookingCost - totalPaid;

  return {
    booking_id: bookingId,
    booking_total: bookingTotal,
    total_refunded: totalRefunded,
    effective_booking_cost: effectiveBookingCost,
    participant_ids: participantIds,
    shares,
    payments: paymentsByParticipant,
    remaining_balance: remainingBalance
  };
}

module.exports = { recomputeBooking };