require('dotenv').config();

const { getTripSettlements } = require('./tripSettlement');

const SAMPLE_TRIP_ID =
    '11111111-1111-1111-1111-111111111111';

async function run() {
    try {
        const result = await getTripSettlements(SAMPLE_TRIP_ID);

        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error(
            'getTripSettlements failed:',
            err.message
        );
    }
}

run();