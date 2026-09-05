const pool = require('../db/db');
const { recomputeBooking } = require('./recompute');

async function getVendorReconciliation(bookingId) {
    if (!bookingId) {
        throw new Error('getVendorReconciliation: bookingId is required');
    }

    // Get the financial state calculated by the Living Ledger
    const financialState = await recomputeBooking(bookingId);

    // Get vendor name
    const bookingResult = await pool.query(
        `SELECT vendor_name FROM bookings WHERE id = $1`,
        [bookingId]
    );

    if (bookingResult.rows.length === 0) {
        throw new Error(
            `getVendorReconciliation: no booking found with id ${bookingId}`
        );
    }

    const vendorName = bookingResult.rows[0].vendor_name;

    // Get participant names for people who made payments
    const paymentResult = await pool.query(
        `
        SELECT
            pay.payer_id,
            p.name AS participant_name,
            pay.amount
        FROM payments pay
        JOIN participants p
            ON p.id = pay.payer_id
        WHERE pay.booking_id = $1
        `,
        [bookingId]
    );

    const paymentsByParticipant = {};

    for (const row of paymentResult.rows) {
        const participantName = row.participant_name;
        const amount = Number(row.amount) || 0;

        paymentsByParticipant[participantName] =
            (paymentsByParticipant[participantName] || 0) + amount;
    }

    const totalPaid = Object.values(financialState.payments)
        .reduce((sum, amount) => sum + amount, 0);

    return {
        booking_id: bookingId,
        vendor_name: vendorName,
        booking_total: financialState.booking_total,
        total_paid: totalPaid,
        total_refunded: financialState.total_refunded,
        effective_cost: financialState.effective_booking_cost,
        status: financialState.status,
        payments_by_participant: paymentsByParticipant
    };
}

module.exports = {
    getVendorReconciliation
};