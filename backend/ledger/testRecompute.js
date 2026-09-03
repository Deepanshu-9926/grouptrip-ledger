require('dotenv').config();

const { recomputeBooking } = require('./recompute');

const SAMPLE_BOOKING_ID = '33333333-3333-3333-3333-333333333333';

async function run() {
  try {
    const result = await recomputeBooking(SAMPLE_BOOKING_ID);
    console.log('Recompute result:');
    console.log(result);
  } catch (err) {
    console.error('recomputeBooking failed:', err.message);
  }
}

run();