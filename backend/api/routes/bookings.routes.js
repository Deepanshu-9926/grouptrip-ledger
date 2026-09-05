const express = require('express');

const router = express.Router();

const bookingsController = require('../controllers/bookings.controller');
const { getVendorReconciliation } = require('../../ledger/vendorLedger');

// Vendor reconciliation ledger
router.get('/:bookingId/vendor-ledger', async (req, res) => {
    try {
        const result = await getVendorReconciliation(req.params.bookingId);

        res.json(result);
    } catch (error) {
        console.error('Vendor ledger error:', error);

        res.status(500).json({
            error: error.message
        });
    }
});

// Get, update and delete booking
router.get('/:id', bookingsController.getBooking);

router.put('/:id', bookingsController.updateBooking);

router.delete('/:id', bookingsController.deleteBooking);

// Payments nested under a booking
router.get(
    '/:bookingId/payments',
    bookingsController.listPaymentsForBooking
);

router.post(
    '/:bookingId/payments',
    bookingsController.createPaymentForBooking
);

// Booking <-> participant linking
router.post(
    '/:bookingId/participants',
    bookingsController.addParticipantToBooking
);

router.delete(
    '/:bookingId/participants/:participantId',
    bookingsController.removeParticipantFromBooking
);

// Booking lifecycle: cancellation and refunds
router.post(
    '/:bookingId/cancel',
    bookingsController.cancelBooking
);

router.post(
    '/:bookingId/refund',
    bookingsController.issueRefund
);

module.exports = router;