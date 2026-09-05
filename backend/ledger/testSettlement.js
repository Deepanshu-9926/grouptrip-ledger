const assert = require('assert');
const { calculateSettlements } = require('./settlement');

// ---------------------------------------------------------------
// TEST 1: Two people, one owes the other
// ---------------------------------------------------------------
function testTwoPeopleSimple() {
  const financialState = {
    booking_id: 'test-1',
    participant_ids: ['A', 'B'],
    shares: { A: 1750, B: 1750 },
    payments: { A: 3000, B: 500 }
  };

  const result = calculateSettlements(financialState);

  assert.strictEqual(result.length, 1, 'expected exactly 1 transfer');
  assert.strictEqual(result[0].from, 'B');
  assert.strictEqual(result[0].to, 'A');
  assert.strictEqual(result[0].amount, 1250);

  console.log('TEST 1 passed: two people, simple transfer');
}

// ---------------------------------------------------------------
// TEST 2: Three people, one creditor and two debtors
// ---------------------------------------------------------------
function testOneCreditorTwoDebtors() {
  // Booking total 900, split equally 300 each.
  // A paid 900 (fronted everything), B and C paid nothing.
  const financialState = {
    booking_id: 'test-2',
    participant_ids: ['A', 'B', 'C'],
    shares: { A: 300, B: 300, C: 300 },
    payments: { A: 900, B: 0, C: 0 }
  };

  const result = calculateSettlements(financialState);

  assert.strictEqual(result.length, 2, 'expected exactly 2 transfers');

  const totalToA = result
    .filter((t) => t.to === 'A')
    .reduce((sum, t) => sum + t.amount, 0);

  assert.strictEqual(totalToA, 600, 'A should receive 600 total (300 from B + 300 from C)');
  result.forEach((t) => assert.strictEqual(t.to, 'A'));

  console.log('TEST 2 passed: one creditor, two debtors');
}

// ---------------------------------------------------------------
// TEST 3: Two creditors and two debtors
// ---------------------------------------------------------------
function testTwoCreditorsTwoDebtors() {
  // Booking total 2000, split equally 500 each among A, B, C, D.
  // A paid 1000 (+500 credit), B paid 800 (+300 credit),
  // C paid 200 (-300 debit), D paid 0 (-500 debit).
  const financialState = {
    booking_id: 'test-3',
    participant_ids: ['A', 'B', 'C', 'D'],
    shares: { A: 500, B: 500, C: 500, D: 500 },
    payments: { A: 1000, B: 800, C: 200, D: 0 }
  };

  const result = calculateSettlements(financialState);

  // No zero-value transfers
  result.forEach((t) => assert.ok(t.amount > 0, 'transfer amount must be greater than 0'));

  // Every transfer must go from an actual debtor to an actual creditor
  result.forEach((t) => {
    assert.ok(['C', 'D'].includes(t.from), 'from must be a debtor');
    assert.ok(['A', 'B'].includes(t.to), 'to must be a creditor');
  });

  // Total transferred must equal total debt (800) and total credit (800)
  const totalTransferred = result.reduce((sum, t) => sum + t.amount, 0);
  assert.strictEqual(totalTransferred, 800);

  console.log('TEST 3 passed: two creditors, two debtors, no zero-value transfers');
}

// ---------------------------------------------------------------
// TEST 4: Everyone already settled
// ---------------------------------------------------------------
function testEveryoneSettled() {
  const financialState = {
    booking_id: 'test-4',
    participant_ids: ['A', 'B'],
    shares: { A: 500, B: 500 },
    payments: { A: 500, B: 500 }
  };

  const result = calculateSettlements(financialState);

  assert.deepStrictEqual(result, []);

  console.log('TEST 4 passed: everyone already settled returns []');
}

// ---------------------------------------------------------------
// TEST 5: Decimal amounts, rounded to 2 decimal places
// ---------------------------------------------------------------
function testDecimalAmounts() {
  // Booking total 1000, split equally among 3 -> 333.333... each.
  const financialState = {
    booking_id: 'test-5',
    participant_ids: ['A', 'B', 'C'],
    shares: {
      A: 333.3333333,
      B: 333.3333333,
      C: 333.3333333
    },
    payments: { A: 1000, B: 0, C: 0 }
  };

  const result = calculateSettlements(financialState);

  result.forEach((t) => {
    const rounded = Math.round(t.amount * 100) / 100;
    assert.strictEqual(t.amount, rounded, 'amount must already be rounded to 2 decimals');
  });

  console.log('TEST 5 passed: decimal amounts rounded to 2 decimal places:', result);
}

// ---------------------------------------------------------------
// TEST 6: Total owed by debtors equals total received by creditors
// ---------------------------------------------------------------
function testTotalsBalance() {
  const financialState = {
    booking_id: 'test-6',
    participant_ids: ['A', 'B', 'C', 'D'],
    shares: { A: 400, B: 400, C: 400, D: 400 },
    payments: { A: 1000, B: 600, C: 0, D: 0 }
  };

  const result = calculateSettlements(financialState);

  const totalFromDebtors = result.reduce((sum, t) => sum + t.amount, 0);
  const totalToCreditors = result.reduce((sum, t) => sum + t.amount, 0);

  assert.ok(
    Math.abs(totalFromDebtors - totalToCreditors) < 0.01,
    'total transferred should match on both sides within 0.01'
  );

  console.log('TEST 6 passed: totals balance within 0.01 tolerance');
}

// ---------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------
function runAllTests() {
  testTwoPeopleSimple();
  testOneCreditorTwoDebtors();
  testTwoCreditorsTwoDebtors();
  testEveryoneSettled();
  testDecimalAmounts();
  testTotalsBalance();
  console.log('All settlement tests passed.');
}

runAllTests();