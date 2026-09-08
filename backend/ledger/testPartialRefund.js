require('dotenv').config();

const { recomputeBooking } = require('./recompute');

const BOOKING_ID =
    '96274470-c86c-4763-9449-c142f64bd350';

async function run() {
    try {
        const result = await recomputeBooking(BOOKING_ID);

        console.log('--- Partial Refund Edge Case ---');

        console.log('Booking total:', result.booking_total);
        console.log('Total refunded:', result.total_refunded);
        console.log('Effective cost:', result.effective_booking_cost);
        console.log('Status:', result.status);

        console.log('Shares:', result.shares);
        console.log('Payments:', result.payments);
        console.log('Remaining balance:', result.remaining_balance);

    } catch (err) {
        console.error(
            'Partial refund test failed:',
            err.message
        );
    }
}

run();