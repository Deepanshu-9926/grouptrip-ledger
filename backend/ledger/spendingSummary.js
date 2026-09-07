const pool = require('../db/db');
const { recomputeBooking } = require('./recompute');

// Maps the bookings.category values already used in the schema to the
// response keys the frontend chart expects.
const CATEGORY_KEY_MAP = {
  Transport: 'transport',
  Accommodation: 'accommodation',
  Activity: 'activities',
  Other: 'other'
};

function toDateOnlyString(dateValue) {
  return new Date(dateValue).toISOString().slice(0, 10);
}

// Builds one entry per calendar day from start_date to end_date inclusive,
// with day 1 = start_date, so every trip date appears even with 0 spend.
function buildDateRange(startDateStr, endDateStr) {
  const dates = [];
  const current = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T00:00:00.000Z`);
  let dayNumber = 1;

  while (current <= end) {
    dates.push({
      date: current.toISOString().slice(0, 10),
      day: dayNumber
    });

    current.setUTCDate(current.getUTCDate() + 1);
    dayNumber += 1;
  }

  return dates;
}

function roundMoney(amount) {
  return Math.round((Number(amount) || 0) * 100) / 100;
}

/**
 * Builds a day-by-day spending breakdown for a trip, grouped by booking
 * category. Reuses recomputeBooking() for each booking's effective cost,
 * so refunds, cancellations, and cost modifications are already reflected.
 *
 * @param {string} tripId
 * @returns {object}
 */
async function getTripSpendingSummary(tripId) {
  if (!tripId) {
    throw new Error('getTripSpendingSummary: tripId is required');
  }

  const tripResult = await pool.query(
    'SELECT id, start_date, end_date FROM trips WHERE id = $1',
    [tripId]
  );

  if (tripResult.rows.length === 0) {
    throw new Error(
      `getTripSpendingSummary: no trip found with id ${tripId}`
    );
  }

  const trip = tripResult.rows[0];

  const startDateStr = toDateOnlyString(trip.start_date);
  const endDateStr = toDateOnlyString(trip.end_date);

  const bookingsResult = await pool.query(
    'SELECT id, category, booking_datetime FROM bookings WHERE trip_id = $1',
    [tripId]
  );

  // Create one bucket for every day of the trip.
  const dayEntries = buildDateRange(startDateStr, endDateStr);

  const summaryByDate = {};

  for (const entry of dayEntries) {
    summaryByDate[entry.date] = {
      date: entry.date,
      day: entry.day,
      transport: 0,
      accommodation: 0,
      activities: 0,
      other: 0,
      total: 0
    };
  }

  // Add each booking's effective cost to the correct date/category.
  for (const booking of bookingsResult.rows) {
    const state = await recomputeBooking(booking.id);

    const effectiveCost =
      Number(state.effective_booking_cost) || 0;

    const bookingDateStr =
      toDateOnlyString(booking.booking_datetime);

    const bucket = summaryByDate[bookingDateStr];

    // Ignore bookings outside the trip date range.
    if (!bucket) {
      continue;
    }

    const categoryKey =
      CATEGORY_KEY_MAP[booking.category] || 'other';

    bucket[categoryKey] += effectiveCost;
    bucket.total += effectiveCost;
  }

  const dailySpending = dayEntries.map((entry) => {
    const bucket = summaryByDate[entry.date];

    return {
      date: bucket.date,
      day: bucket.day,
      transport: roundMoney(bucket.transport),
      accommodation: roundMoney(bucket.accommodation),
      activities: roundMoney(bucket.activities),
      other: roundMoney(bucket.other),
      total: roundMoney(bucket.total)
    };
  });

  return {
    trip_id: tripId,
    daily_spending: dailySpending
  };
}

module.exports = {
  getTripSpendingSummary
};