const express = require('express');

const router = express.Router();

const tripsController = require('../controllers/trips.controller');

// Trips

router.get('/', tripsController.listTrips);

router.get('/:id', tripsController.getTrip);

router.post('/', tripsController.createTrip);

router.put('/:id', tripsController.updateTrip);

router.delete('/:id', tripsController.deleteTrip);


// Trip financial summary

router.get(
    '/:tripId/financial-summary',
    tripsController.getTripFinancialSummaryForTrip
);

// Trip settlements

router.get(
    '/:tripId/settlements',
    tripsController.getTripSettlementsForTrip
);

//Trip spending summary
router.get('/:tripId/spending-summary', tripsController.getSpendingSummary);
router.get('/:tripId/vendors', tripsController.getVendorLedger);

// Participants under a trip

router.get(
    '/:tripId/participants',
    tripsController.listParticipantsForTrip
);

router.post(
    '/:tripId/participants',
    tripsController.createParticipantForTrip
);

// Bookings under a trip

router.get(
    '/:tripId/bookings',
    tripsController.listBookingsForTrip
);

router.post(
    '/:tripId/bookings',
    tripsController.createBookingForTrip
);

router.post('/:tripId/invites', 
    tripsController.createTripInvite);

module.exports = router;