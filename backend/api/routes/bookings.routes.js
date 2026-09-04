const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings.controller');

router.get('/:id', bookingsController.getBooking);
router.put('/:id', bookingsController.updateBooking);
router.delete('/:id', bookingsController.deleteBooking);

// Payments nested under a booking
router.get('/:bookingId/payments', bookingsController.listPaymentsForBooking);
router.post('/:bookingId/payments', bookingsController.createPaymentForBooking);

// Booking <-> participant linking
router.post('/:bookingId/participants', bookingsController.addParticipantToBooking);
router.delete('/:bookingId/participants/:participantId', bookingsController.removeParticipantFromBooking);

// Booking lifecycle: cancellation and refunds
router.post('/:bookingId/cancel', bookingsController.cancelBooking);
router.post('/:bookingId/refund', bookingsController.issueRefund);

module.exports = router;