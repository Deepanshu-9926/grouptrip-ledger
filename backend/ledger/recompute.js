const pool = require('../db/db');

function calculateShares(effectiveBookingCost, participantIds, costSharing) {
  if (!participantIds || participantIds.length === 0) {
    return {};
  }

  const mode =
    costSharing && costSharing.mode === 'tiered'
      ? 'tiered'
      : 'equal';

  const rawWeights =
    mode === 'tiered' && costSharing.weights
      ? costSharing.weights
      : {};

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

  const totalWeight = weights.reduce(
    (sum, weight) => sum + weight,
    0
  );

  const totalCostCents = Math.round(
    effectiveBookingCost * 100
  );

  const shareCents = participantIds.map((_, index) => {
    const weightShare = weights[index] / totalWeight;

    return Math.round(totalCostCents * weightShare);
  });

  // Fix rounding difference so shares always add up exactly
  const sumOfShareCents = shareCents.reduce(
    (sum, cents) => sum + cents,
    0
  );

  const roundingDifference =
    totalCostCents - sumOfShareCents;

  if (roundingDifference !== 0 && shareCents.length > 0) {
    shareCents[shareCents.length - 1] += roundingDifference;
  }

  const shares = {};

  participantIds.forEach((participantId, index) => {
    shares[participantId] = shareCents[index] / 100;
  });

  return shares;
}

async function recomputeBooking(bookingId) {
  if (!bookingId) {
    throw new Error(
      'recomputeBooking: bookingId is required'
    );
  }

  // 1. Fetch booking
  const bookingResult = await pool.query(
    'SELECT * FROM bookings WHERE id = $1',
    [bookingId]
  );

  if (bookingResult.rows.length === 0) {
    throw new Error(
      `recomputeBooking: no booking found with id ${bookingId}`
    );
  }

  const booking = bookingResult.rows[0];

  // 2. Fetch all events in deterministic sequence order
  const eventsResult = await pool.query(
    `SELECT *
     FROM events
     WHERE booking_id = $1
     ORDER BY sequence ASC`,
    [bookingId]
  );

  const events = eventsResult.rows;

  // 3. Replay events
  const currentParticipants = new Set();
  const paymentsByParticipant = {};

  let totalRefunded = 0;
  let currentBookingCost = Number(booking.total_cost);
  let isCancelled = false;
  let costSharingConfig = null;

  for (const event of events) {
    const payload = event.payload || {};

    switch (event.event_type) {
      case 'booking_added':
        if (payload.cost_sharing) {
          costSharingConfig = payload.cost_sharing;
        }
        break;

      case 'participant_added_to_booking':
        currentParticipants.add(payload.participant_id);
        break;

      case 'participant_removed_from_booking':
        currentParticipants.delete(payload.participant_id);
        break;

      case 'payment_logged': {
        const payerId = payload.payer_id;
        const amount = Number(payload.amount) || 0;

        paymentsByParticipant[payerId] =
          (paymentsByParticipant[payerId] || 0) + amount;

        break;
      }

      case 'refund_issued': {
        const refundAmount = Number(payload.amount) || 0;
        totalRefunded += refundAmount;
        break;
      }

      case 'booking_cost_modified':
        if (payload.total_cost !== undefined) {
          currentBookingCost = Number(payload.total_cost);
        }
        break;

      case 'booking_cancelled':
        isCancelled = true;
        break;

      default:
        break;
    }
  }

  const participantIds = Array.from(currentParticipants);

  // 4. Calculate effective cost
  const effectiveBookingCost = isCancelled
    ? 0
    : Math.max(
        0,
        currentBookingCost - totalRefunded
      );

  // 5. Calculate shares using the booking's cost-sharing configuration
  const shares = isCancelled
    ? {}
    : calculateShares(
        effectiveBookingCost,
        participantIds,
        costSharingConfig
      );

  // 6. Calculate total paid
  const totalPaid = Object.values(
    paymentsByParticipant
  ).reduce(
    (sum, amount) => sum + amount,
    0
  );

  const remainingBalance =
    effectiveBookingCost - totalPaid;

  const resolvedCostSharing =
    costSharingConfig &&
    costSharingConfig.mode === 'tiered'
      ? {
          mode: 'tiered',
          weights: costSharingConfig.weights || {}
        }
      : {
          mode: 'equal'
        };

  return {
    booking_id: bookingId,
    booking_total: currentBookingCost,
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

module.exports = {
  recomputeBooking,
  calculateShares
};