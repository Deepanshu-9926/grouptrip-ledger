const pool = require('../db/db');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
    // Create a fresh booking for this test run
    const bookingResponse = await fetch(
        `${BASE_URL}/api/trips/11111111-1111-1111-1111-111111111111/bookings`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                category: 'Accommodation',
                vendor_name: 'Integration Test Vendor',
                total_cost: 999,
                booking_datetime: '2026-09-10T10:00:00Z',
                refund_policy: 'fully_refundable',
                refundable_amount: 999
            })
        }
    );

    if (!bookingResponse.ok) {
        throw new Error(
            `Failed to create booking: ${await bookingResponse.text()}`
        );
    }

    const bookingResult = await bookingResponse.json();
    const bookingId = bookingResult.data.id;

    // A. Booking creation -> booking_added event
    const bookingEventCheck = await pool.query(
        `SELECT * FROM events
         WHERE booking_id = $1
         AND event_type = 'booking_added'
         LIMIT 1`,
        [bookingId]
    );

    if (bookingEventCheck.rows.length === 0) {
        throw new Error('A. booking_added event was not created');
    }

    console.log(
        'A. PASSED: booking creation created a booking_added event'
    );


    // B. Add participant -> participant_added_to_booking event
    const participantId =
        '22222222-2222-2222-2222-222222222222';

    const participantResponse = await fetch(
        `${BASE_URL}/api/bookings/${bookingId}/participants`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                participant_id: participantId
            })
        }
    );

    if (!participantResponse.ok) {
        throw new Error(
            `B. Failed to add participant: ${await participantResponse.text()}`
        );
    }

    const participantEventCheck = await pool.query(
        `SELECT * FROM events
         WHERE booking_id = $1
         AND event_type = 'participant_added_to_booking'
         LIMIT 1`,
        [bookingId]
    );

    if (participantEventCheck.rows.length === 0) {
        throw new Error(
            'B. participant_added_to_booking event was not created'
        );
    }

    console.log(
        'B. PASSED: adding a participant created a participant_added_to_booking event'
    );


    // C. Payment -> payment_logged event
    const paymentResponse = await fetch(
        `${BASE_URL}/api/bookings/${bookingId}/payments`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payer_participant_id:
                    '22222222-2222-2222-2222-222222222221',
                amount: 500,
                paid_at: '2026-09-06T10:00:00Z'
            })
        }
    );

    if (!paymentResponse.ok) {
        throw new Error(
            `C. Failed to create payment: ${await paymentResponse.text()}`
        );
    }

    const paymentEventCheck = await pool.query(
        `SELECT * FROM events
         WHERE booking_id = $1
         AND event_type = 'payment_logged'
         LIMIT 1`,
        [bookingId]
    );

    if (paymentEventCheck.rows.length === 0) {
        throw new Error(
            'C. payment_logged event was not created'
        );
    }

    console.log(
        'C. PASSED: logging a payment created a payment_logged event'
    );


    // D. Remove participant -> participant_removed_from_booking event
    const removeResponse = await fetch(
        `${BASE_URL}/api/bookings/${bookingId}/participants/${participantId}`,
        {
            method: 'DELETE'
        }
    );

    if (!removeResponse.ok) {
        throw new Error(
            `D. Failed to remove participant: ${await removeResponse.text()}`
        );
    }

    const removeEventCheck = await pool.query(
        `SELECT * FROM events
         WHERE booking_id = $1
         AND event_type = 'participant_removed_from_booking'
         LIMIT 1`,
        [bookingId]
    );

    if (removeEventCheck.rows.length === 0) {
        throw new Error(
            'D. participant_removed_from_booking event was not created'
        );
    }

    console.log(
        'D. PASSED: removing a participant created a participant_removed_from_booking event'
    );


    // E. Cancel booking -> booking_cancelled event
    const cancelResponse = await fetch(
        `${BASE_URL}/api/bookings/${bookingId}/cancel`,
        {
            method: 'POST'
        }
    );

    if (!cancelResponse.ok) {
        throw new Error(
            `E. Failed to cancel booking: ${await cancelResponse.text()}`
        );
    }

    const cancelEventCheck = await pool.query(
        `SELECT * FROM events
         WHERE booking_id = $1
         AND event_type = 'booking_cancelled'
         LIMIT 1`,
        [bookingId]
    );

    if (cancelEventCheck.rows.length === 0) {
        throw new Error(
            'E. booking_cancelled event was not created'
        );
    }

    console.log(
        'E. PASSED: cancelling a booking created a booking_cancelled event'
    );


    console.log('\nAll API event-integration tests passed.');

    await pool.end();
}

runTests().catch(async (err) => {
    console.error('\nTEST FAILED:', err);
    await pool.end();
    process.exit(1);
});