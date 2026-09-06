const pool = require('../db/db');
const { recomputeBooking } = require('./recompute');

const bookingId = 'bac4a143-6477-4903-bec5-49aa5e9bbd89';

async function runTest() {
    try {
        // Get current booking before modification.
        const beforeResult = await pool.query(
            `SELECT total_cost
             FROM bookings
             WHERE id = $1`,
            [bookingId]
        );

        if (beforeResult.rows.length === 0) {
            throw new Error('Booking not found');
        }

        const oldCost = Number(beforeResult.rows[0].total_cost);

        console.log('Old booking cost:', oldCost);

        // Check that the booking currently has no
        // cost modification event.
        const beforeEvents = await pool.query(
            `SELECT *
             FROM events
             WHERE booking_id = $1
               AND event_type = 'booking_cost_modified'`,
            [bookingId]
        );

        console.log(
            'Existing cost modification events:',
            beforeEvents.rows.length
        );

        // Change cost through the API.
        const newCost = oldCost + 1000;

        const response = await fetch(
            `http://localhost:5000/api/bookings/${bookingId}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    category: 'Accommodation',
                    vendor_name: 'Integration Test Vendor',
                    total_cost: newCost,
                    booking_datetime: '2026-09-10T10:00:00Z',
                    refund_policy: 'fully_refundable',
                    refundable_amount: newCost
                })
            }
        );

        if (!response.ok) {
            throw new Error(
                `API update failed: ${await response.text()}`
            );
        }

        console.log('Booking cost updated to:', newCost);

        // Check that the event was created.
        const eventResult = await pool.query(
            `SELECT *
             FROM events
             WHERE booking_id = $1
               AND event_type = 'booking_cost_modified'
             ORDER BY sequence DESC
             LIMIT 1`,
            [bookingId]
        );

        if (eventResult.rows.length === 0) {
            throw new Error(
                'booking_cost_modified event was not created'
            );
        }

        const event = eventResult.rows[0];

        console.log('Cost modification event:', event.payload);

        if (Number(event.payload.total_cost) !== newCost) {
            throw new Error(
                'Event does not contain the new booking cost'
            );
        }

        if (
            Number(event.payload.previous_total_cost) !== oldCost
        ) {
            throw new Error(
                'Event does not contain the previous booking cost'
            );
        }

        // Finally verify recompute().
        const state = await recomputeBooking(bookingId);

        console.log(
            'Recomputed booking cost:',
            state.booking_total
        );

        if (Number(state.booking_total) !== newCost) {
            throw new Error(
                `Recompute did not use the new cost. Expected ${newCost}, got ${state.booking_total}`
            );
        }

        console.log(
            'PASSED: booking cost modification is logged and recomputed correctly'
        );
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runTest();