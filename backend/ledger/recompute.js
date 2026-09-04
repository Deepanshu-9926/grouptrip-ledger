const pool = require('../db/db');

/**
 * Calculates each participant's share of a cost, given a cost-sharing
 * configuration. Pure function — no database access — so it can be
 * unit-tested directly.
 *
 * @param {number} effectiveBookingCost
 * @param {string[]} participantIds - current participant set, in order
 * @param {object} [costSharing] - e.g. { mode: 'equal' } or { mode: 'tiered', weights: {...} }
 * @returns {object} map of participantId -> share amount (2 decimal places)
 */
function calculateShares(effectiveBookingCost, participantIds, costSharing) {
  if (!participantIds || participantIds.length === 0) {
    return {};
  }

  // Unknown/missing mode falls back to equal split.
  const mode = costSharing && costSharing.mode === 'tiered' ? 'tiered' : 'equal';
  const rawWeights = (mode === 'tiered' && costSharing.weights) ? costSharing.weights : {};

  // Resolve one weight per current participant. Missing or invalid
  // (non-positive / non-numeric) weights default to 1, and equal mode
  // simply uses a weight of 1 for everyone.
  const weights = participantIds.map((participantId) => {
    if (mode === 'equal') {
      return 1;
    }
    const rawWeight = Number(rawWeights[participantId]);
    if (!Number.isFinite(rawWeight) || rawWeight <= 0) {
      return 1;
    }
    return rawWeight;
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Work in integer cents to keep rounding accurate and predictable.
  const totalCostCents = Math.round(effectiveBookingCost * 100);

  const shareCents = participantIds.map((_, index) => {
    const weightShare = weights[index] / totalWeight;
    return Math.round(totalCostCents * weightShare);
  });

  // Rounding each share independently can leave a 1-2 cent gap versus the
  // total cost — correct it by adjusting the last participant's share.
  const sumOfShareCents = shareCents.reduce((sum, c) => sum + c, 0);
  const roundingDifference = totalCostCents - sumOfShareCents;
  if (roundingDifference !== 0 && shareCents.length > 0) {
    shareCents[shareCents.length - 1] += roundingDifference;
  }

  const shares = {};
  participantIds.forEach((participantId, index) => {
    shares[participantId] = shareCents[index] / 100;
  });

  return shares;
}

/**
 * Recomputes the current financial state of a booking by replaying its
 * full event history from the events table.
 *
 * @param {string} bookingId
 * @returns {object} {
 *   booking_id, booking_total, total_refunded, effective_booking_cost,
 *   status, cancelled, cost_sharing, participant_ids, shares, payments,
 *   remaining_balance
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
  //    refunds, cost modifications, cancellation state, and cost-sharing config
  const currentParticipants = new Set();
  const paymentsByParticipant = {};
  let totalRefunded = 0;
  let currentBookingCost = Number(booking.total_cost);
  let isCancelled = false;
  let costSharingConfig = null;

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
        // Booking creation itself has no direct financial/membership effect,
        // but it may carry the cost-sharing configuration for this booking.
        if (payload.cost_sharing) {
          costSharingConfig = payload.cost_sharing;
        }
        break;

      default:
        // Unknown event type — ignore rather than throw, so recompute
        // doesn't break on future event types added later.
        break;
    }
  }

  const participantIds = Array.from(currentParticipants);

  // 4. Effective cost after modifications, refunds, and cancellation.
  const effectiveBookingCost = isCancelled
    ? 0
    : Math.max(0, currentBookingCost - totalRefunded);

  // 5. Calculate shares using whatever cost-sharing mode is configured.
  //    A cancelled booking has no shares owed, regardless of mode.
  const shares = isCancelled
    ? {}
    : calculateShares(effectiveBookingCost, participantIds, costSharingConfig);

  // 6. Total paid across all payment_logged events — preserved even if the
  //    booking is later cancelled, since payment history must never be lost.
  const totalPaid = Object.values(paymentsByParticipant).reduce((sum, amount) => sum + amount, 0);
  const remainingBalance = effectiveBookingCost - totalPaid;

  // Resolve the cost_sharing field for the output — reflects the same
  // fallback-to-equal rule used inside calculateShares.
  const resolvedCostSharing = (costSharingConfig && costSharingConfig.mode === 'tiered')
    ? { mode: 'tiered', weights: costSharingConfig.weights || {} }
    : { mode: 'equal' };

  return {
    booking_id: bookingId,
    booking_total: currentBookingCost, // reflects modifications; preserved even after cancellation
    total_refunded: totalRefunded,
    effective_booking_cost: effectiveBookingCost,
    status: isCancelled ? 'cancelled' : 'active',
    cancelled: isCancelled,
    cost_sharing: resolvedCostSharing,
    participant_ids: participantIds,
    shares,
    payments: paymentsByParticipant,
    remaining_balance: remainingBalance
  };
}

module.exports = { recomputeBooking, calculateShares };