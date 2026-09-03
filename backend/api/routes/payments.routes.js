const express = require('express');
const router = express.Router();

const paymentsController = require('../controllers/payments.controller');

router.delete('/:id', paymentsController.deletePayment);

module.exports = router;