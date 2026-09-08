require('dotenv').config();

const pool = require('../db/db');
const { recomputeBooking } = require('./recompute');

const BOOKING_ID =
    '96274470-c86c-4763-9449-c142f64bd350';

async function run() {
    try {
        const result = await recomputeBooking(BOOKING_ID);

        console.log('--- Rejoin After Leave Edge Case ---');

        console.log('Current participants:');
        console.log(result.participant_ids);

        console.log('Total refunded:', result.total_refunded);
        console.log('Effective cost:', result.effective_booking_cost);

        console.log('Current shares:');
        console.log(result.shares);

        console.log('Payments:');
        console.log(result.payments);

        // Check that Rahul is currently participating
        const rahulId =
            '22222222-2222-2222-2222-222222222222';

        const rahulPresent =
            result.participant_ids.includes(rahulId);

        console.log(
            'Rahul currently participating:',
            rahulPresent
        );

        // Check that the refund was preserved
        console.log(
            'Refund preserved:',
            result.total_refunded === 1000
        );

        // Check effective cost
        console.log(
            'Effective cost correct:',
            result.effective_booking_cost === 3300
        );

    } catch (err) {
        console.error(
            'Rejoin test failed:',
            err.message
        );
    } finally {
        await pool.end();
    }
}

run();