const pool = require('../db/db');
const { recomputeBooking } = require('./recompute');

/**
 * Aggregates financial state across every booking in a trip, by reusing
 * recomputeBooking() per booking and summing the results. Does not
 * re-implement any event-replay, refund, cancellation, or cost-sharing
 * logic — all of that stays owned by recompute.js.
 *
 * @param {string} tripId
 * @returns {object} {
 *   trip_id,
 *   bookings: [ ...recomputeBooking() results ],
 *   participants: {
 *     participantId: { total_owed, total_paid, net_balance }
 *   }
 * }
 */
async function getTripFinancialSummary(tripId) {
  if (!tripId) {
    throw new Error('getTripFinancialSummary: tripId is required');
  }

  // 1. Verify the trip exists
  const tripResult = await pool.query('SELECT id FROM trips WHERE id = $1', [tripId]);
  if (tripResult.rows.length === 0) {
    throw new Error(`getTripFinancialSummary: no trip found with id ${tripId}`);
  }

  // 2. Fetch all bookings for this trip
  const bookingsResult = await pool.query(
    'SELECT id FROM bookings WHERE trip_id = $1',
    [tripId]
  );

  const bookingIds = bookingsResult.rows.map((row) => row.id);

  // 3. Recompute each booking individually — this is the only place
  // financial state is derived, reused as-is.
  const bookingStates = [];
  for (const bookingId of bookingIds) {
    const state = await recomputeBooking(bookingId);
    bookingStates.push(state);
  }

  // 4. Aggregate owed/paid per participant across all bookings, in
  // integer cents to avoid floating-point drift when summing many values.
  const owedCentsByParticipant = {};
  const paidCentsByParticipant = {};

  for (const bookingState of bookingStates) {
    const shares = bookingState.shares || {};
    const payments = bookingState.payments || {};

    for (const participantId of Object.keys(shares)) {
      const amountCents = Math.round(Number(shares[participantId]) * 100);
      owedCentsByParticipant[participantId] = (owedCentsByParticipant[participantId] || 0) + amountCents;
    }

    for (const participantId of Object.keys(payments)) {
      const amountCents = Math.round(Number(payments[participantId]) * 100);
      paidCentsByParticipant[participantId] = (paidCentsByParticipant[participantId] || 0) + amountCents;
    }
  }

  // Every participant who appears in either owed or paid totals needs an entry.
  const allParticipantIds = new Set([
    ...Object.keys(owedCentsByParticipant),
    ...Object.keys(paidCentsByParticipant)
  ]);

  const participants = {};
  for (const participantId of allParticipantIds) {
    const owedCents = owedCentsByParticipant[participantId] || 0;
    const paidCents = paidCentsByParticipant[participantId] || 0;
    const netCents = paidCents - owedCents;

    participants[participantId] = {
      total_owed: owedCents / 100,
      total_paid: paidCents / 100,
      net_balance: netCents / 100
    };
  }

  return {
    trip_id: tripId,
    bookings: bookingStates,
    participants
  };
}

module.exports = { getTripFinancialSummary };