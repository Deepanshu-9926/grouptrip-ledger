const pool = require('../../db/db');
const { addEvent } = require('../../ledger/eventLog');

// GET /api/bookings/:id
async function getBooking(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM bookings WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        res.status(200).json({
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch booking'
        });
    }
}


// PUT /api/bookings/:id
async function updateBooking(req, res) {
    const {
        category,
        vendor_name,
        total_cost,
        booking_datetime,
        refund_policy,
        refundable_amount,
        cancellation_deadline,
        status
    } = req.body;

    if (
        !category ||
        !vendor_name ||
        total_cost === undefined ||
        !booking_datetime
    ) {
        return res.status(400).json({
            error: 'category, vendor_name, total_cost and booking_datetime are required'
        });
    }

    try {
        const result = await pool.query(
            `UPDATE bookings
             SET category = $1,
                 vendor_name = $2,
                 total_cost = $3,
                 booking_datetime = $4,
                 refund_policy = COALESCE($5, refund_policy),
                 refundable_amount = COALESCE($6, refundable_amount),
                 cancellation_deadline = $7,
                 status = COALESCE($8, status)
             WHERE id = $9
             RETURNING *`,
            [
                category,
                vendor_name,
                total_cost,
                booking_datetime,
                refund_policy,
                refundable_amount,
                cancellation_deadline || null,
                status,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        res.status(200).json({
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(400).json({
            error: 'Failed to update booking — check your input values'
        });
    }
}


// DELETE /api/bookings/:id
async function deleteBooking(req, res) {
    try {
        const result = await pool.query(
            'DELETE FROM bookings WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        res.status(200).json({
            data: {
                id: result.rows[0].id
            }
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to delete booking'
        });
    }
}


// GET /api/bookings/:bookingId/payments
async function listPaymentsForBooking(req, res) {
    try {
        const result = await pool.query(
            `SELECT *
             FROM payments
             WHERE booking_id = $1
             ORDER BY paid_at ASC`,
            [req.params.bookingId]
        );

        res.status(200).json({
            data: result.rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch payments'
        });
    }
}


// POST /api/bookings/:bookingId/payments
async function createPaymentForBooking(req, res) {
    const {
        payer_id,
        amount,
        paid_at
    } = req.body;

    if (!payer_id || amount === undefined || !paid_at) {
        return res.status(400).json({
            error: 'payer_id, amount and paid_at are required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check that booking exists
        const bookingCheck = await client.query(
            'SELECT id FROM bookings WHERE id = $1',
            [req.params.bookingId]
        );

        if (bookingCheck.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        // Check that payer exists
        const payerCheck = await client.query(
            'SELECT id FROM participants WHERE id = $1',
            [payer_id]
        );

        if (payerCheck.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(400).json({
                error: 'payer_id does not match an existing participant'
            });
        }

        // Create payment
        const result = await client.query(
            `INSERT INTO payments
                (payer_id, booking_id, amount, paid_at)
             VALUES
                ($1, $2, $3, $4)
             RETURNING *`,
            [
                payer_id,
                req.params.bookingId,
                amount,
                paid_at
            ]
        );

        const payment = result.rows[0];

        // Create ledger event using the SAME transaction
        await addEvent(
            req.params.bookingId,
            'payment_logged',
            {
                payment_id: payment.id,
                booking_id: req.params.bookingId,
                payer_id,
                amount: Number(amount),
                paid_at
            },
            client
        );

        // Commit payment + event together
        await client.query('COMMIT');

        res.status(201).json({
            data: payment
        });

    } catch (err) {
        await client.query('ROLLBACK');

        console.error(err);

        res.status(400).json({
            error: 'Failed to create payment — check your input values'
        });

    } finally {
        client.release();
    }
}
// POST /api/bookings/:bookingId/participants
async function addParticipantToBooking(req, res) {
    const { participant_id } = req.body;

    if (!participant_id) {
        return res.status(400).json({
            error: 'participant_id is required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check that booking exists
        const bookingCheck = await client.query(
            'SELECT id FROM bookings WHERE id = $1',
            [req.params.bookingId]
        );

        if (bookingCheck.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        // Check that participant exists
        const participantCheck = await client.query(
            'SELECT id FROM participants WHERE id = $1',
            [participant_id]
        );

        if (participantCheck.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Participant not found'
            });
        }

        // Add participant to booking
        const result = await client.query(
            `INSERT INTO booking_participants
                (booking_id, participant_id)
             VALUES
                ($1, $2)
             RETURNING *`,
            [
                req.params.bookingId,
                participant_id
            ]
        );

        // Create ledger event using the SAME transaction client
        await addEvent(
            req.params.bookingId,
            'participant_added_to_booking',
            {
                booking_id: req.params.bookingId,
                participant_id
            },
            client
        );

        await client.query('COMMIT');

        res.status(201).json({
            data: result.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');

        // Unique constraint
        if (err.code === '23505') {
            return res.status(400).json({
                error: 'Participant is already part of this booking'
            });
        }

        console.error(err);

        res.status(500).json({
            error: 'Failed to add participant to booking'
        });

    } finally {
        client.release();
    }
}


// DELETE /api/bookings/:bookingId/participants/:participantId
async function removeParticipantFromBooking(req, res) {
    try {
        const result = await pool.query(
            `DELETE FROM booking_participants
             WHERE booking_id = $1
             AND participant_id = $2
             RETURNING id`,
            [
                req.params.bookingId,
                req.params.participantId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'This participant is not linked to this booking'
            });
        }

        res.status(200).json({
            data: {
                id: result.rows[0].id
            }
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to remove participant from booking'
        });
    }
}


module.exports = {
    getBooking,
    updateBooking,
    deleteBooking,
    listPaymentsForBooking,
    createPaymentForBooking,
    addParticipantToBooking,
    removeParticipantFromBooking
};