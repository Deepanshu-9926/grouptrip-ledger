require('dotenv').config();

const { recomputeBooking } = require('./recompute');
const { calculateSettlements } = require('./settlement');

async function testSettlementIntegration() {
  const bookingId = '96274470-c86c-4763-9449-c142f64bd350';

  const financialState = await recomputeBooking(bookingId);

  console.log('Financial State:');
  console.log(financialState);

  const settlements = calculateSettlements(financialState);

  console.log('\nSettlement Transfers:');
  console.log(settlements);

  process.exit(0);
}

testSettlementIntegration().catch((error) => {
  console.error(error);
  process.exit(1);
});