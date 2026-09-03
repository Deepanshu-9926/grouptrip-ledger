const pool = require('../../db/db');

// GET /api/trips
async function listTrips(req, res) {
  try {
    const result = await pool.query('SELECT * FROM trips ORDER BY created_at DESC');
    res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
}

// GET /api/trips/:id
async function getTrip(req, res) {
  try {
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
}

// POST /api/trips
async function createTrip(req, res) {
  const { name, destination, start_date, end_date } = req.body;

  if (!name || !destination || !start_date || !end_date) {
    return res.status(400).json({ error: 'name, destination, start_date and end_date are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO trips (name, destination, start_date, end_date)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, destination, start_date, end_date]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create trip' });
  }
}

// PUT /api/trips/:id
async function updateTrip(req, res) {
  const { name, destination, start_date, end_date } = req.body;

  if (!name || !destination || !start_date || !end_date) {
    return res.status(400).json({ error: 'name, destination, start_date and end_date are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE trips
       SET name = $1, destination = $2, start_date = $3, end_date = $4
       WHERE id = $5
       RETURNING *`,
      [name, destination, start_date, end_date, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.status(200).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update trip' });
  }
}

// DELETE /api/trips/:id
async function deleteTrip(req, res) {
  try {
    const result = await pool.query('DELETE FROM trips WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.status(200).json({ data: { id: result.rows[0].id } });
  } catch (err) {
    // Foreign key violation (e.g. a participant on this trip has payment records
    // that block deletion because payments.payer_id is ON DELETE RESTRICT)
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Cannot delete trip: related records (e.g. payments) still reference it' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
}

// GET /api/trips/:tripId/participants
async function listParticipantsForTrip(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM participants WHERE trip_id = $1 ORDER BY created_at ASC',
      [req.params.tripId]
    );
    res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
}

// POST /api/trips/:tripId/participants
async function createParticipantForTrip(req, res) {
  const { name, phone, upi_id, role } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'name and phone are required' });
  }

  try {
    const tripCheck = await pool.query('SELECT id FROM trips WHERE id = $1', [req.params.tripId]);
    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const result = await pool.query(
      `INSERT INTO participants (trip_id, name, phone, upi_id, role)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'Member'))
       RETURNING *`,
      [req.params.tripId, name, phone, upi_id || null, role]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create participant' });
  }
}

// GET /api/trips/:tripId/bookings
async function listBookingsForTrip(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM bookings WHERE trip_id = $1 ORDER BY booking_datetime ASC',
      [req.params.tripId]
    );
    res.status(200).json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

// POST /api/trips/:tripId/bookings
async function createBookingForTrip(req, res) {
  const {
    category, vendor_name, total_cost, booking_datetime,
    refund_policy, refundable_amount, cancellation_deadline, status
  } = req.body;

  if (!category || !vendor_name || total_cost === undefined || !booking_datetime) {
    return res.status(400).json({ error: 'category, vendor_name, total_cost and booking_datetime are required' });
  }

  try {
    const tripCheck = await pool.query('SELECT id FROM trips WHERE id = $1', [req.params.tripId]);
    if (tripCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const result = await pool.query(
      `INSERT INTO bookings
        (trip_id, category, vendor_name, total_cost, booking_datetime, refund_policy, refundable_amount, cancellation_deadline, status)
       VALUES
        ($1, $2, $3, $4, $5, COALESCE($6, 'non_refundable'), COALESCE($7, 0), $8, COALESCE($9, 'active'))
       RETURNING *`,
      [
        req.params.tripId, category, vendor_name, total_cost, booking_datetime,
        refund_policy, refundable_amount, cancellation_deadline || null, status
      ]
    );
    res.status(201).json({ data: result.rows[0] });
  } catch (err) {
    // Catches CHECK constraint failures too, e.g. invalid category or refundable_amount > total_cost
    console.error(err);
    res.status(400).json({ error: 'Failed to create booking — check your input values' });
  }
}

module.exports = {
  listTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
  listParticipantsForTrip,
  createParticipantForTrip,
  listBookingsForTrip,
  createBookingForTrip
};