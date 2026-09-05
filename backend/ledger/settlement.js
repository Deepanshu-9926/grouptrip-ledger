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

    const balancesInCents = {};

    for (const participantId of participantIds) {
        const owed = Number(shares[participantId]) || 0;
        const paid = Number(payments[participantId]) || 0;

        balancesInCents[participantId] =
            Math.round((paid - owed) * 100);
    }

    const creditors = [];
    const debtors = [];

    for (const participantId of participantIds) {
        const cents = balancesInCents[participantId];

        if (cents > 0) {
            creditors.push({
                id: participantId,
                cents
            });
        } else if (cents < 0) {
            debtors.push({
                id: participantId,
                cents: -cents
            });
        }
    }

    creditors.sort((a, b) => b.cents - a.cents);
    debtors.sort((a, b) => b.cents - a.cents);

    const transfers = [];

    let creditorIndex = 0;
    let debtorIndex = 0;

    while (
        creditorIndex < creditors.length &&
        debtorIndex < debtors.length
    ) {
        const creditor = creditors[creditorIndex];
        const debtor = debtors[debtorIndex];

        const transferCents = Math.min(
            creditor.cents,
            debtor.cents
        );

        if (transferCents > 0) {
            transfers.push({
                from: debtor.id,
                to: creditor.id,
                amount: transferCents / 100
            });
        }

        creditor.cents -= transferCents;
        debtor.cents -= transferCents;

        if (creditor.cents === 0) {
            creditorIndex++;
        }

        if (debtor.cents === 0) {
            debtorIndex++;
        }
    }

    return transfers;
}

module.exports = {
    calculateSettlements
};