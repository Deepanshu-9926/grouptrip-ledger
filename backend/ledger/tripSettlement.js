const { calculateSettlements } = require('./settlement');
const { getTripFinancialSummary } = require('./tripLedger');

async function getTripSettlements(tripId) {
    if (!tripId) {
        throw new Error('getTripSettlements: tripId is required');
    }

    const tripSummary = await getTripFinancialSummary(tripId);

    const participantIds = Object.keys(tripSummary.participants);

    const shares = {};
    const payments = {};

    for (const participantId of participantIds) {
        const participant = tripSummary.participants[participantId];

        shares[participantId] = participant.total_owed;
        payments[participantId] = participant.total_paid;
    }

    const settlements = calculateSettlements({
        participant_ids: participantIds,
        shares,
        payments
    });

    return {
        trip_id: tripId,
        settlements
    };
}

module.exports = {
    getTripSettlements
};