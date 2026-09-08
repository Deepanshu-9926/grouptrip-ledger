require('dotenv').config();

const { recomputeBooking } = require('./recompute');

const SAMPLE_BOOKING_ID = '96274470-c86c-4763-9449-c142f64bd350';

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