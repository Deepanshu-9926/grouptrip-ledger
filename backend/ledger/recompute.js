const pool = require('../db/db');

/**
 * Recomputes the current financial state of a booking by replaying its
 * full event history from the events table.
 *
 * @param {string} bookingId
 * @returns {object} {
 *   booking_id, booking_total, total_refunded, effective_booking_cost,
 *   status, cancelled, participant_ids, shares, payments, remaining_balance
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

  // 2. Fetch all events for this booking, replayed in strict insertion order
  const eventsResult = await pool.query(
    'SELECT * FROM events WHERE booking_id = $1 ORDER BY sequence ASC',
    [bookingId]
  );

  const events = eventsResult.rows;

  // 3. Replay events to derive current participant set, payment totals,
  //    refunds, cost modifications, and cancellation state
  const currentParticipants = new Set();
  const paymentsByParticipant = {};
  let totalRefunded = 0;
  let currentBookingCost = Number(booking.total_cost);
  let isCancelled = false;

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

      case 'booking_cost_modified': {
        if (payload.total_cost !== undefined) {
          currentBookingCost = Number(payload.total_cost);
        }
        break;
      }

      case 'booking_cancelled':
        isCancelled = true;
        break;

      case 'booking_added':
        // No financial or membership effect on its own — booking creation
        // is represented separately by participant_added_to_booking events.
        break;

      default:
        // Unknown event type — ignore rather than throw, so recompute
        // doesn't break on future event types added later.
        break;
    }
  }

  const participantIds = Array.from(currentParticipants);

  // 4. Effective cost after modifications, refunds, and cancellation.
  //    A cancelled booking always has an effective cost of 0, regardless of
  //    modifications or refunds — but currentBookingCost itself is preserved
  //    below (in booking_total) for audit purposes.
  const effectiveBookingCost = isCancelled
    ? 0
    : Math.max(0, currentBookingCost - totalRefunded);

  // 5. Calculate equal shares from the effective cost, guarding against
  //    division by zero. A cancelled booking has no shares owed.
  const shares = {};
  if (!isCancelled && participantIds.length > 0) {
    const sharePerParticipant = effectiveBookingCost / participantIds.length;
    for (const participantId of participantIds) {
      shares[participantId] = sharePerParticipant;
    }
  }

  // 6. Total paid across all payment_logged events — preserved even if the
  //    booking is later cancelled, since payment history must never be lost.
  const totalPaid = Object.values(paymentsByParticipant).reduce((sum, amount) => sum + amount, 0);
  const remainingBalance = effectiveBookingCost - totalPaid;

  return {
    booking_id: bookingId,
    booking_total: currentBookingCost, // reflects modifications; preserved even after cancellation
    total_refunded: totalRefunded,
    effective_booking_cost: effectiveBookingCost,
    status: isCancelled ? 'cancelled' : 'active',
    cancelled: isCancelled,
    participant_ids: participantIds,
    shares,
    payments: paymentsByParticipant,
    remaining_balance: remainingBalance
  };
}

module.exports = { recomputeBooking };