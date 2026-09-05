require('dotenv').config();
const { getVendorReconciliation } = require('./vendorLedger');

const BOOKING_ID = '96274470-c86c-4763-9449-c142f64bd350';

async function runTest() {
    try {
        const result = await getVendorReconciliation(BOOKING_ID);

        console.log('\nVendor Reconciliation Ledger:\n');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
    console.error('Test failed:');
    console.error(error);
}
}

runTest();