const pool = require('../../db/db');
const { addEvent } = require('../../ledger/eventLog');


// ============================================================
// GET BOOKING
// ============================================================

async function getBooking(req, res) {
    try {
        const result = await pool.query(
            `SELECT *
             FROM bookings
             WHERE id = $1`,
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


// ============================================================
// UPDATE BOOKING
// ============================================================

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

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get the existing booking first so we can compare
        // the old cost with the new cost.
        const existingResult = await client.query(
            `SELECT *
             FROM bookings
             WHERE id = $1`,
            [req.params.id]
        );

        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        const existingBooking = existingResult.rows[0];

        // Update the booking.
        const result = await client.query(
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

        // Create a ledger event only if the cost actually changed.
        if (
            Number(existingBooking.total_cost) !==
            Number(total_cost)
        ) {
            await addEvent(
                req.params.id,
                'booking_cost_modified',
                {
                    booking_id: req.params.id,
                    previous_total_cost: Number(existingBooking.total_cost),
                    total_cost: Number(total_cost),
                    modified_at: new Date().toISOString()
                },
                client
            );
        }

        await client.query('COMMIT');

        res.status(200).json({
            data: result.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');

        console.error(err);

        res.status(400).json({
            error: 'Failed to update booking — check your input values'
        });
    } finally {
        client.release();
    }
}


// ============================================================
// DELETE BOOKING
// ============================================================

async function deleteBooking(req, res) {
    try {
        const result = await pool.query(
            `DELETE FROM bookings
             WHERE id = $1
             RETURNING *`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        res.status(200).json({
            message: 'Booking deleted successfully',
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);

        res.status(400).json({
            error: 'Failed to delete booking'
        });
    }
}


// ============================================================
// LIST PAYMENTS FOR BOOKING
// ============================================================

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


// ============================================================
// CREATE PAYMENT FOR BOOKING
// ============================================================

async function createPaymentForBooking(req, res) {
    const {
        payer_participant_id,
        amount,
        paid_at
    } = req.body;

    if (
        !payer_participant_id ||
        amount === undefined
    ) {
        return res.status(400).json({
            error: 'payer_participant_id and amount are required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check booking exists.
        const bookingResult = await client.query(
            `SELECT id
             FROM bookings
             WHERE id = $1`,
            [req.params.bookingId]
        );

        if (bookingResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        // Check participant exists.
        const participantResult = await client.query(
            `SELECT id
             FROM participants
             WHERE id = $1`,
            [payer_participant_id]
        );

        if (participantResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Participant not found'
            });
        }

        // IMPORTANT:
        // API uses payer_participant_id.
        // Database column is payer_id.
        const paymentResult = await client.query(
            `INSERT INTO payments
                (booking_id, payer_id, amount, paid_at)
             VALUES
                ($1, $2, $3, COALESCE($4, NOW()))
             RETURNING *`,
            [
                req.params.bookingId,
                payer_participant_id,
                amount,
                paid_at || null
            ]
        );

        // Record payment in immutable event log.
        await addEvent(
            req.params.bookingId,
            'payment_logged',
            {
                payment_id: paymentResult.rows[0].id,
                booking_id: req.params.bookingId,
                payer_participant_id,
                amount: Number(amount),
                paid_at: paymentResult.rows[0].paid_at
            },
            client
        );

        await client.query('COMMIT');

        res.status(201).json({
            data: paymentResult.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');

        console.error(err);

        res.status(400).json({
            error: 'Failed to create payment'
        });
    } finally {
        client.release();
    }
}


// ============================================================
// ADD PARTICIPANT TO BOOKING
// ============================================================

async function addParticipantToBooking(req, res) {
    const {
        participant_id
    } = req.body;

    if (!participant_id) {
        return res.status(400).json({
            error: 'participant_id is required'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check booking exists.
        const bookingResult = await client.query(
            `SELECT id
             FROM bookings
             WHERE id = $1`,
            [req.params.bookingId]
        );

        if (bookingResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        // Check participant exists.
        const participantResult = await client.query(
            `SELECT id
             FROM participants
             WHERE id = $1`,
            [participant_id]
        );

        if (participantResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Participant not found'
            });
        }

        // Check whether participant is already attached.
        const existingResult = await client.query(
            `SELECT *
             FROM booking_participants
             WHERE booking_id = $1
               AND participant_id = $2`,
            [
                req.params.bookingId,
                participant_id
            ]
        );

        if (existingResult.rows.length > 0) {
            await client.query('ROLLBACK');

            return res.status(409).json({
                error: 'Participant is already added to this booking'
            });
        }

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

        // Record participant addition in ledger.
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

        console.error(err);

        res.status(400).json({
            error: 'Failed to add participant to booking'
        });
    } finally {
        client.release();
    }
}


// ============================================================
// REMOVE PARTICIPANT FROM BOOKING
// ============================================================

async function removeParticipantFromBooking(req, res) {
    const {
        participantId,
        bookingId
    } = req.params;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `DELETE FROM booking_participants
             WHERE booking_id = $1
               AND participant_id = $2
             RETURNING *`,
            [
                bookingId,
                participantId
            ]
        );

        if (result.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Participant is not part of this booking'
            });
        }

        // Record participant removal in ledger.
        await addEvent(
            bookingId,
            'participant_removed_from_booking',
            {
                booking_id: bookingId,
                participant_id: participantId
            },
            client
        );

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Participant removed from booking',
            data: result.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');

        console.error(err);

        res.status(400).json({
            error: 'Failed to remove participant from booking'
        });
    } finally {
        client.release();
    }
}


// ============================================================
// CANCEL BOOKING
// ============================================================

async function cancelBooking(req, res) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const existingResult = await client.query(
            `SELECT *
             FROM bookings
             WHERE id = $1`,
            [req.params.id]
        );

        if (existingResult.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        const existingBooking = existingResult.rows[0];

        if (existingBooking.status === 'cancelled') {
            await client.query('ROLLBACK');

            return res.status(409).json({
                error: 'Booking is already cancelled'
            });
        }

        const result = await client.query(
            `UPDATE bookings
             SET status = 'cancelled'
             WHERE id = $1
             RETURNING *`,
            [req.params.id]
        );

        // Record cancellation in ledger.
        await addEvent(
            req.params.id,
            'booking_cancelled',
            {
                booking_id: req.params.id,
                previous_status: existingBooking.status,
                cancelled_at: new Date().toISOString()
            },
            client
        );

        await client.query('COMMIT');

        res.status(200).json({
            message: 'Booking cancelled successfully',
            data: result.rows[0]
        });
    } catch (err) {
        await client.query('ROLLBACK');

        console.error(err);

        res.status(400).json({
            error: 'Failed to cancel booking'
        });
    } finally {
        client.release();
    }
}

// ============================================================
// GET BOOKING EVENTS (AUDIT TRAIL)
// ============================================================

async function getBookingEvents(req, res) {
    try {
        const bookingCheck = await pool.query(
            `SELECT id
             FROM bookings
             WHERE id = $1`,
            [req.params.bookingId]
        );

        if (bookingCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Booking not found'
            });
        }

        const eventsResult = await pool.query(
            `SELECT sequence, event_type, payload, created_at
             FROM events
             WHERE booking_id = $1
             ORDER BY sequence ASC`,
            [req.params.bookingId]
        );

        res.status(200).json({
            data: eventsResult.rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch booking events'
        });
    }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
    getBooking,
    updateBooking,
    deleteBooking,
    listPaymentsForBooking,
    createPaymentForBooking,
    addParticipantToBooking,
    removeParticipantFromBooking,
    cancelBooking,
    getBookingEvents
};