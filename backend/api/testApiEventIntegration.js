require('dotenv').config();

const pool = require('../db/db');

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

// Existing seed data
const SAMPLE_TRIP_ID = '11111111-1111-1111-1111-111111111111';
const SAMPLE_PARTICIPANT_ID = '22222222-2222-2222-2222-222222222221'; // Aditi

async function eventExists(bookingId, eventType) {
  const result = await pool.query(
    'SELECT * FROM events WHERE booking_id = $1 AND event_type = $2 ORDER BY sequence DESC LIMIT 1',
    [bookingId, eventType]
  );
  return result.rows[0] || null;
}

async function testBookingCreationCreatesEvent() {
  const response = await fetch(`${BASE_URL}/api/trips/${SAMPLE_TRIP_ID}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'Other',
      vendor_name: 'Integration Test Vendor',
      total_cost: 999,
      booking_datetime: '2026-12-14T09:00:00+05:30'
    })
  });

  const body = await response.json();

  if (response.status !== 201) {
    throw new Error(`Expected 201 creating booking, got ${response.status}: ${JSON.stringify(body)}`);
  }

  const bookingId = body.data.id;
  const event = await eventExists(bookingId, 'booking_added');

  if (!event) {
    throw new Error('FAILED: no booking_added event found after creating a booking');
  }

  console.log('A. PASSED: booking creation created a booking_added event');
  return bookingId;
}

async function testAddParticipantCreatesEvent(bookingId) {
  const response = await fetch(`${BASE_URL}/api/bookings/${bookingId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participant_id: SAMPLE_PARTICIPANT_ID })
  });

  const body = await response.json();

  if (response.status !== 201) {
    throw new Error(`Expected 201 adding participant, got ${response.status}: ${JSON.stringify(body)}`);
  }

  const event = await eventExists(bookingId, 'participant_added_to_booking');

  if (!event) {
    throw new Error('FAILED: no participant_added_to_booking event found');
  }

  console.log('B. PASSED: adding a participant created a participant_added_to_booking event');
}

async function testPaymentCreatesEvent(bookingId) {
  const response = await fetch(`${BASE_URL}/api/bookings/${bookingId}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payer_id: SAMPLE_PARTICIPANT_ID,
      amount: 999,
      paid_at: '2026-12-01T10:00:00+05:30'
    })
  });

  const body = await response.json();

  if (response.status !== 201) {
    throw new Error(`Expected 201 creating payment, got ${response.status}: ${JSON.stringify(body)}`);
  }

  const event = await eventExists(bookingId, 'payment_logged');

  if (!event) {
    throw new Error('FAILED: no payment_logged event found after logging a payment');
  }

  console.log('C. PASSED: logging a payment created a payment_logged event');
}

async function run() {
  try {
    const bookingId = await testBookingCreationCreatesEvent();
    await testAddParticipantCreatesEvent(bookingId);
    await testPaymentCreatesEvent(bookingId);
    console.log('All API event-integration tests passed.');
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();