const express = require('express');

const router = express.Router();

const invitesController = require('../controllers/invites.controller');

// Get invite details
router.get('/:token', invitesController.getInviteDetails);

// Join trip using invite
router.post('/:token/join', invitesController.joinTripByInvite);

module.exports = router;