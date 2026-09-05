/**
 * Calculates the minimum set of transfers needed to settle a booking,
 * based on the financial state already produced by recomputeBooking().
 *
 * Does NOT touch the database and does NOT recalculate shares/costs —
 * it only works with the numbers it's given.
 *
 * @param {object} financialState - shape compatible with recomputeBooking()'s return value
 * @returns {Array<{from: string, to: string, amount: number}>}
 */
function calculateSettlements(financialState) {
  if (!financialState || typeof financialState !== 'object') {
    throw new Error('calculateSettlements: financialState is required');
  }

  const participantIds = financialState.participant_ids || [];
  const shares = financialState.shares || {};
  const payments = financialState.payments || {};

  if (participantIds.length === 0) {
    return [];
  }

  // Convert every balance to integer cents up front to avoid floating-point
  // drift while transferring amounts back and forth.
  const balancesInCents = {};
  for (const participantId of participantIds) {
    const owed = Number(shares[participantId]) || 0;
    const paid = Number(payments[participantId]) || 0;
    const netAmount = paid - owed;
    balancesInCents[participantId] = Math.round(netAmount * 100);
  }

  // Creditors: positive balance (should receive money).
  // Debtors: negative balance, stored as a positive "amount owed" for convenience.
  const creditors = [];
  const debtors = [];

  for (const participantId of participantIds) {
    const cents = balancesInCents[participantId];
    if (cents > 0) {
      creditors.push({ id: participantId, cents });
    } else if (cents < 0) {
      debtors.push({ id: participantId, cents: -cents });
    }
    // cents === 0 -> already settled, not added to either list
  }

  creditors.sort((a, b) => b.cents - a.cents);
  debtors.sort((a, b) => b.cents - a.cents);

  const transfers = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const transferCents = Math.min(creditor.cents, debtor.cents);

    if (transferCents > 0) {
      transfers.push({
        from: debtor.id,
        to: creditor.id,
        amount: transferCents / 100
      });

      creditor.cents -= transferCents;
      debtor.cents -= transferCents;
    }

    if (creditor.cents === 0) {
      creditorIndex += 1;
    }
    if (debtor.cents === 0) {
      debtorIndex += 1;
    }
  }

  return transfers;
}

module.exports = { calculateSettlements };