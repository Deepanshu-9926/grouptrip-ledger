const pool = require('../db/db');
const { recomputeBooking } = require('./recompute');

const bookingId = 'bac4a143-6477-4903-bec5-49aa5e9bbd89';

async function runTest() {
    try {
        const state = await recomputeBooking(bookingId);

        console.log('Booking:', bookingId);
        console.log('Status:', state.status);
        console.log('Effective booking cost:', state.effective_booking_cost);
        console.log('Shares:', state.shares);

        if (state.status !== 'cancelled') {
            throw new Error(
                `Expected status to be cancelled, got ${state.status}`
            );
        }

        if (Number(state.effective_booking_cost) !== 0) {
            throw new Error(
                `Expected effective booking cost to be 0, got ${state.effective_booking_cost}`
            );
        }

        console.log(
            'PASSED: cancelled booking recomputes to effective booking cost ₹0'
        );
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runTest();