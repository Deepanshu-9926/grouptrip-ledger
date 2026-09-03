const express = require('express');
const router = express.Router();

const bookingsController = require('../controllers/bookings.controller');

// Booking
router.get('/:id', bookingsController.getBooking);
router.put('/:id', bookingsController.updateBooking);
router.delete('/:id', bookingsController.deleteBooking);

// Payments for a booking
router.get('/:bookingId/payments', bookingsController.listPaymentsForBooking);
router.post('/:bookingId/payments', bookingsController.createPaymentForBooking);

// Participants for a booking
router.post('/:bookingId/participants', bookingsController.addParticipantToBooking);
router.delete(
    '/:bookingId/participants/:participantId',
    bookingsController.removeParticipantFromBooking
);

module.exports = router;