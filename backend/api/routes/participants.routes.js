const express = require('express');
const router = express.Router();

const participantsController = require('../controllers/participants.controller');

router.get('/:id', participantsController.getParticipant);
router.put('/:id', participantsController.updateParticipant);
router.delete('/:id', participantsController.deleteParticipant);

module.exports = router;