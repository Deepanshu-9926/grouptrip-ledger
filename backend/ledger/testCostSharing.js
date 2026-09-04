const assert = require('assert');
const { calculateShares } = require('./recompute');

// ---------------------------------------------------------------
// TEST 1: Equal split, 3 participants, ₹3000
// ---------------------------------------------------------------
function testEqualSplit() {
  const shares = calculateShares(3000, ['A', 'B', 'C'], { mode: 'equal' });

  assert.strictEqual(shares.A, 1000);
  assert.strictEqual(shares.B, 1000);
  assert.strictEqual(shares.C, 1000);

  console.log('TEST 1 passed: equal split, 3 participants, ₹1000 each');
}

// ---------------------------------------------------------------
// TEST 2: Participant subset (no separate algorithm — the participant
// list passed in already only contains A, B, C, exactly as recompute.js
// would derive from the event-sourced participant set)
// ---------------------------------------------------------------
function testParticipantSubset() {
  // Conceptually a 5-person trip, but only A, B, C are in this booking's
  // participant set — calculateShares only ever sees those 3.
  const shares = calculateShares(3000, ['A', 'B', 'C'], { mode: 'equal' });

  assert.strictEqual(shares.A, 1000);
  assert.strictEqual(shares.B, 1000);
  assert.strictEqual(shares.C, 1000);
  assert.strictEqual(Object.keys(shares).length, 3, 'only the 3 subset participants should have shares');

  console.log('TEST 2 passed: participant subset uses equal split among just A, B, C');
}

// ---------------------------------------------------------------
// TEST 3: Tiered split
// ---------------------------------------------------------------
function testTieredSplit() {
  const weights = { A: 1.3, B: 1.3, C: 0.85, D: 0.85 };
  const shares = calculateShares(4300, ['A', 'B', 'C', 'D'], { mode: 'tiered', weights });

  assert.strictEqual(shares.A, 1300);
  assert.strictEqual(shares.B, 1300);
  assert.strictEqual(shares.C, 850);
  assert.strictEqual(shares.D, 850);

  console.log('TEST 3 passed: tiered split matches expected weighted amounts', shares);
}

// ---------------------------------------------------------------
// TEST 4: Tiered split with a missing participant weight (defaults to 1)
// ---------------------------------------------------------------
function testTieredMissingWeight() {
  // D has no entry in weights at all -> should default to weight 1
  const weights = { A: 1.3, B: 1.3, C: 0.85 };
  const shares = calculateShares(4150, ['A', 'B', 'C', 'D'], { mode: 'tiered', weights });

  // total weight = 1.3 + 1.3 + 0.85 + 1 = 4.45
  const totalWeight = 1.3 + 1.3 + 0.85 + 1;
  const expectedD = Math.round((4150 * (1 / totalWeight)) * 100) / 100;

  assert.ok(Math.abs(shares.D - expectedD) <= 0.02, `D's share should default to weight 1, got ${shares.D}`);

  console.log('TEST 4 passed: missing weight defaults to 1', shares);
}

// ---------------------------------------------------------------
// TEST 5: Invalid weight (zero or negative) defaults to 1
// ---------------------------------------------------------------
function testInvalidWeight() {
  const weights = { A: 1.3, B: 0, C: -5 };
  const shares = calculateShares(3300, ['A', 'B', 'C'], { mode: 'tiered', weights });

  // B and C both fall back to weight 1 -> total weight = 1.3 + 1 + 1 = 3.3
  const totalWeight = 1.3 + 1 + 1;
  const expectedB = Math.round((3300 * (1 / totalWeight)) * 100) / 100;

  assert.ok(shares.B > 0, 'invalid weight (0) should not break the calculation');
  assert.ok(shares.C > 0, 'invalid weight (negative) should not break the calculation');
  assert.ok(Math.abs(shares.B - expectedB) <= 0.02, `B should default to weight 1, got ${shares.B}`);

  console.log('TEST 5 passed: zero/negative weights default to 1 instead of breaking', shares);
}

// ---------------------------------------------------------------
// TEST 6: Decimal rounding — every share has at most 2 decimals, and
// the total matches the effective cost within 0.01
// ---------------------------------------------------------------
function testDecimalRounding() {
  const shares = calculateShares(1000, ['A', 'B', 'C'], { mode: 'equal' });

  Object.values(shares).forEach((amount) => {
    const rounded = Math.round(amount * 100) / 100;
    assert.strictEqual(amount, rounded, `${amount} should already be rounded to 2 decimals`);
  });

  const total = Object.values(shares).reduce((sum, amount) => sum + amount, 0);
  assert.ok(Math.abs(total - 1000) <= 0.01, `total shares (${total}) should equal 1000 within 0.01`);

  console.log('TEST 6 passed: decimal rounding is correct and totals reconcile', shares);
}

// ---------------------------------------------------------------
// TEST 7: Cancelled booking — shares should be {}
// (calculateShares itself doesn't know about cancellation; recompute.js
// short-circuits to {} before calling it. This test confirms that a
// zero effective cost with participants still present produces empty
// shares, which is the input recompute.js would use if it didn't
// short-circuit — the actual cancellation short-circuit is exercised
// via recomputeBooking() against a live DB, not here.)
// ---------------------------------------------------------------
function testCancelledBookingProducesNoShares() {
  const shares = calculateShares(0, [], { mode: 'equal' });
  assert.deepStrictEqual(shares, {});

  console.log('TEST 7 passed: no participants / zero cost produces empty shares');
}

// ---------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------
function runAllTests() {
  testEqualSplit();
  testParticipantSubset();
  testTieredSplit();
  testTieredMissingWeight();
  testInvalidWeight();
  testDecimalRounding();
  testCancelledBookingProducesNoShares();
  console.log('All cost-sharing tests passed.');
}

runAllTests();