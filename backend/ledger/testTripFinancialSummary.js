const pool = require('../db/db');
const { getTripFinancialSummary } = require('./tripLedger');

const tripId = '11111111-1111-1111-1111-111111111111';

async function runTest() {
    try {
        const summary = await getTripFinancialSummary(tripId);

        console.log('Trip:', summary.trip_id);
        console.log('\nBookings:');
        console.log(summary.bookings);

        console.log('\nParticipants:');
        console.log(summary.participants);

        if (summary.trip_id !== tripId) {
            throw new Error('Trip ID mismatch');
        }

        if (!summary.bookings || summary.bookings.length === 0) {
            throw new Error('No bookings found in trip summary');
        }

        if (!summary.participants || Object.keys(summary.participants).length === 0) {
            throw new Error('No participant financial data found');
        }

        console.log('\nPASSED: trip financial summary generated correctly');
    } catch (err) {
        console.error('TEST FAILED:', err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runTest();