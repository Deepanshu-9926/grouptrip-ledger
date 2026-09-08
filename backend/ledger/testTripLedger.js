require('dotenv').config();

const { getTripFinancialSummary } = require('./tripLedger');

// Replace with a real trip id from your seed data before running.
const SAMPLE_TRIP_ID = '11111111-1111-1111-1111-111111111111';

async function run() {
  try {
    const result = await getTripFinancialSummary(SAMPLE_TRIP_ID);
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('getTripFinancialSummary failed:', err.message);
  }
}

run();