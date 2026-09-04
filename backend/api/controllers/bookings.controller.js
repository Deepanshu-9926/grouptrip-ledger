const pool = require('../../db/db');
const { addEvent } = require('../../ledger/eventLog');

// GET /api/bookings/:id
async function getBooking(req, res) {
  try {
    const result = await pool.query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
}

// PUT /api/bookings/:id
async function updateBooking(req, res) {
  const {
    category, vendor_name, total_cost, booking_datetime,
    refund_policy, refundable_amount, cancellation_deadline, status
  } = req.body;

  if (!category || !vendor_name || total_cost === undefined || !booking_datetime) {
    return res.status(400).json({ error: 'category, vendor_name, total_cost and booking_datetime are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE bookings
       SET category = $1, vendor_name = $2, total_cost = $3, booking_datetime = $4,
           refund_policy = COALESCE($5, refund_policy),
           refundable_amount = COALESCE($6, refundable_amount),
           cancellation_deadline = $7,
           status = COALESCE($8, status)
       WHERE id = $9
       RETURNING *`,
      [
        category, vendor_name, total_cost, booking_datetime,
        refund_policy, refundable_amount, cancellation_deadline || null, status,
        req.params.id
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update booking — check your input values' });
  }
}

// DELETE /api/bookings/:id
// Note: booking_participants, payments and events for this booking are set to
// ON DELETE CASCADE in the schema, so they are removed automatically by Postgres.
async function deleteBooking(req, res) {
  try {
    const result = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json({ data: { id: result.rows[0].id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
}

// GET /api/bookings/:bookingId/payments
async function listPaymentsForBooking(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM payments WHERE booking_id = $1 ORDER BY paid_at ASC',
      [req.params.bookingId]
    );
    res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
}

// POST /api/bookings/:bookingId/payments
// Event-aware: the payment row and its payment_logged event are created
// together in a single transaction, so either both succeed or neither does.
async function createPaymentForBooking(req, res) {
  const { payer_id, amount, paid_at } = req.body;

  if (!payer_id || amount === undefined || !paid_at) {
    return res.status(400).json({ error: 'payer_id, amount and paid_at are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingCheck = await client.query('SELECT id, trip_id FROM bookings WHERE id = $1', [req.params.bookingId]);
    if (bookingCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Confirms the payer exists AND belongs to the same trip as the booking,
    // in one query — joins bookings -> participants through trip_id.
    const payerCheck = await client.query(
      `SELECT participants.id
       FROM participants
       JOIN bookings ON bookings.trip_id = participants.trip_id
       WHERE participants.id = $1 AND bookings.id = $2`,
      [payer_id, req.params.bookingId]
    );

    if (payerCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'payer_id does not belong to the same trip as this booking' });
    }

    const paymentResult = await client.query(
      `INSERT INTO payments (payer_id, booking_id, amount, paid_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [payer_id, req.params.bookingId, amount, paid_at]
    );

    const newPayment = paymentResult.rows[0];

    // Same transaction, same client — if this throws, the payment insert
    // above gets rolled back too.
    await addEvent(
      req.params.bookingId,
      'payment_logged',
      { payer_id, amount },
      client
    );

    await client.query('COMMIT');

    res.status(201).json({ data: newPayment });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create payment' });
  } finally {
    client.release();
  }
}

// POST /api/bookings/:bookingId/participants
// Event-aware: the booking_participants row (current state) and its
// participant_added_to_booking event (history) are created together in a
// single transaction, so either both succeed or neither does.
async function addParticipantToBooking(req, res) {
  const { participant_id } = req.body;

  if (!participant_id) {
    return res.status(400).json({ error: 'participant_id is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingCheck = await client.query('SELECT id FROM bookings WHERE id = $1', [req.params.bookingId]);
    if (bookingCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const participantCheck = await client.query('SELECT id FROM participants WHERE id = $1', [participant_id]);
    if (participantCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Participant not found' });
    }

    // Same same-trip rule used for payments: a participant can only be
    // linked to a booking that belongs to their own trip.
    const sameTripCheck = await client.query(
      `SELECT participants.id
       FROM participants
       JOIN bookings ON bookings.trip_id = participants.trip_id
       WHERE participants.id = $1 AND bookings.id = $2`,
      [participant_id, req.params.bookingId]
    );

    if (sameTripCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'participant_id does not belong to the same trip as this booking' });
    }

    const insertResult = await client.query(
      `INSERT INTO booking_participants (booking_id, participant_id)
       VALUES ($1, $2)
       RETURNING *`,
      [req.params.bookingId, participant_id]
    );

    const insertedRow = insertResult.rows[0];

    // Same transaction, same client — if this throws, the insert above
    // gets rolled back too.
    await addEvent(
      req.params.bookingId,
      'participant_added_to_booking',
      { participant_id },
      client
    );

    await client.query('COMMIT');

    res.status(201).json({ data: insertedRow });
  } catch (err) {
    await client.query('ROLLBACK');

    // Unique constraint — this participant is already linked to this booking
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Participant is already part of this booking' });
    }

    console.error(err);
    res.status(500).json({ error: 'Failed to add participant to booking' });
  } finally {
    client.release();
  }
}

// DELETE /api/bookings/:bookingId/participants/:participantId
// Event-aware: the booking_participants row is removed (current state) and a
// participant_removed_from_booking event is recorded (history) together in
// a single transaction.
async function removeParticipantFromBooking(req, res) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const bookingCheck = await client.query('SELECT id FROM bookings WHERE id = $1', [req.params.bookingId]);
    if (bookingCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const deleteResult = await client.query(
      `DELETE FROM booking_participants
       WHERE booking_id = $1 AND participant_id = $2
       RETURNING id`,
      [req.params.bookingId, req.params.participantId]
    );

    if (deleteResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'This participant is not linked to this booking' });
    }

    // Same transaction, same client — if this throws, the delete above
    // gets rolled back (the link is restored).
    await addEvent(
      req.params.bookingId,
      'participant_removed_from_booking',
      { participant_id: req.params.participantId },
      client
    );

    await client.query('COMMIT');

    res.status(200).json({ data: { id: deleteResult.rows[0].id } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to remove participant from booking' });
  } finally {
    client.release();
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