const pool = require('../../db/db');
const { getTripSettlements } = require('../../ledger/tripSettlement');
const { createUpiPaymentLink } = require('../../ledger/upi');
const { addEvent } = require('../../ledger/eventLog');


// GET /api/trips
async function listTrips(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM trips ORDER BY created_at DESC'
        );

        res.status(200).json({
            data: result.rows
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch trips'
        });
    }
}


// GET /api/trips/:id
async function getTrip(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM trips WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Trip not found'
            });
        }

        res.status(200).json({
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch trip'
        });
    }
}


// GET /api/trips/:tripId/settlements
async function getTripSettlementsForTrip(req, res) {
    try {
        const tripId = req.params.tripId;

        const result = await getTripSettlements(tripId);

        const participantsResult = await pool.query(
            `SELECT id, name, upi_id
             FROM participants
             WHERE trip_id = $1`,
            [tripId]
        );

        const participantDetails = {};

        for (const participant of participantsResult.rows) {
            participantDetails[participant.id] = {
                name: participant.name,
                upi_id: participant.upi_id
            };
        }

        const settlementsWithDetails = result.settlements.map(
            (settlement) => {

                const payer = participantDetails[settlement.from];
                const receiver = participantDetails[settlement.to];

                let upiLink = null;

                if (receiver && receiver.upi_id) {
                    upiLink = createUpiPaymentLink(
                        receiver.upi_id,
                        receiver.name,
                        settlement.amount
                    );
                }

                return {
                    from: {
                        id: settlement.from,
                        name: payer ? payer.name : 'Unknown'
                    },
                    to: {
                        id: settlement.to,
                        name: receiver ? receiver.name : 'Unknown'
                    },
                    amount: settlement.amount,
                    upi_link: upiLink
                };
            }
        );

        res.status(200).json({
            trip_id: tripId,
            settlements: settlementsWithDetails
        });

    } catch (err) {
        console.error('Trip settlements error:', err);

        res.status(500).json({
            error: err.message
        });
    }
}


// POST /api/trips
async function createTrip(req, res) {
    const {
        name,
        destination,
        start_date,
        end_date
    } = req.body;

    if (!name || !destination || !start_date || !end_date) {
        return res.status(400).json({
            error: 'name, destination, start_date and end_date are required'
        });
    }

    try {
        const result = await pool.query(
            `INSERT INTO trips
                (name, destination, start_date, end_date)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [
                name,
                destination,
                start_date,
                end_date
            ]
        );

        res.status(201).json({
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to create trip'
        });
    }
}


// PUT /api/trips/:id
async function updateTrip(req, res) {
    const {
        name,
        destination,
        start_date,
        end_date
    } = req.body;

    if (!name || !destination || !start_date || !end_date) {
        return res.status(400).json({
            error: 'name, destination, start_date and end_date are required'
        });
    }

    try {
        const result = await pool.query(
            `UPDATE trips
             SET name = $1,
                 destination = $2,
                 start_date = $3,
                 end_date = $4
             WHERE id = $5
             RETURNING *`,
            [
                name,
                destination,
                start_date,
                end_date,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Trip not found'
            });
        }

        res.status(200).json({
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to update trip'
        });
    }
}


// DELETE /api/trips/:id
async function deleteTrip(req, res) {
    try {
        const result = await pool.query(
            'DELETE FROM trips WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Trip not found'
            });
        }

        res.status(200).json({
            data: {
                id: result.rows[0].id
            }
        });

    } catch (err) {

        // Foreign key violation
        if (err.code === '23503') {
            return res.status(400).json({
                error: 'Cannot delete trip: related records (e.g. payments) still reference it'
            });
        }

        console.error(err);

        res.status(500).json({
            error: 'Failed to delete trip'
        });
    }
}


// GET /api/trips/:tripId/participants
async function listParticipantsForTrip(req, res) {
    try {
        const result = await pool.query(
            `SELECT *
             FROM participants
             WHERE trip_id = $1
             ORDER BY created_at ASC`,
            [req.params.tripId]
        );

        res.status(200).json({
            data: result.rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch participants'
        });
    }
}


// POST /api/trips/:tripId/participants
async function createParticipantForTrip(req, res) {
    const {
        name,
        phone,
        upi_id,
        role
    } = req.body;

    if (!name || !phone) {
        return res.status(400).json({
            error: 'name and phone are required'
        });
    }

    try {
        const tripCheck = await pool.query(
            'SELECT id FROM trips WHERE id = $1',
            [req.params.tripId]
        );

        if (tripCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Trip not found'
            });
        }

        const result = await pool.query(
            `INSERT INTO participants
                (trip_id, name, phone, upi_id, role)
             VALUES ($1, $2, $3, $4, COALESCE($5, 'Member'))
             RETURNING *`,
            [
                req.params.tripId,
                name,
                phone,
                upi_id || null,
                role
            ]
        );

        res.status(201).json({
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to create participant'
        });
    }
}


// GET /api/trips/:tripId/bookings
async function listBookingsForTrip(req, res) {
    try {
        const result = await pool.query(
            `SELECT *
             FROM bookings
             WHERE trip_id = $1
             ORDER BY booking_datetime ASC`,
            [req.params.tripId]
        );

        res.status(200).json({
            data: result.rows
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: 'Failed to fetch bookings'
        });
    }
}


// POST /api/trips/:tripId/bookings
// Transaction-safe and event-aware.
//
// Booking creation and the booking_added ledger event are performed
// inside the same database transaction. If either operation fails,
// both are rolled back.
async function createBookingForTrip(req, res) {

    const {
        category,
        vendor_name,
        total_cost,
        booking_datetime,
        refund_policy,
        refundable_amount,
        cancellation_deadline,
        status,
        cost_sharing
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

    // Resolve cost-sharing configuration.
    // Missing or invalid configuration falls back to equal split.
    const resolvedCostSharing =
        resolveCostSharing(cost_sharing);

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check whether the trip exists.
        const tripCheck = await client.query(
            'SELECT id FROM trips WHERE id = $1',
            [req.params.tripId]
        );

        if (tripCheck.rows.length === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                error: 'Trip not found'
            });
        }

        // Create booking.
        const bookingResult = await client.query(
            `INSERT INTO bookings
                (
                    trip_id,
                    category,
                    vendor_name,
                    total_cost,
                    booking_datetime,
                    refund_policy,
                    refundable_amount,
                    cancellation_deadline,
                    status
                )
             VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    COALESCE($6, 'non_refundable'),
                    COALESCE($7, 0),
                    $8,
                    COALESCE($9, 'active')
                )
             RETURNING *`,
            [
                req.params.tripId,
                category,
                vendor_name,
                total_cost,
                booking_datetime,
                refund_policy,
                refundable_amount,
                cancellation_deadline || null,
                status
            ]
        );

        const newBooking = bookingResult.rows[0];

        // Create the corresponding ledger event using
        // the SAME transaction client.
        await addEvent(
            newBooking.id,
            'booking_added',
            {
                booking_id: newBooking.id,
                cost_sharing: resolvedCostSharing
            },
            client
        );

        // Only commit after both booking and event succeed.
        await client.query('COMMIT');

        res.status(201).json({
            data: newBooking
        });

    } catch (err) {

        // If anything failed, remove the booking and event
        // created during this transaction.
        await client.query('ROLLBACK');

        console.error(err);

        res.status(400).json({
            error: 'Failed to create booking — check your input values'
        });

    } finally {
        client.release();
    }
}


// Resolves the cost-sharing configuration into a safe format.
function resolveCostSharing(rawCostSharing) {

    if (
        !rawCostSharing ||
        typeof rawCostSharing !== 'object'
    ) {
        return {
            mode: 'equal'
        };
    }

    if (rawCostSharing.mode === 'tiered') {

        const weights =
            (
                rawCostSharing.weights &&
                typeof rawCostSharing.weights === 'object'
            )
                ? rawCostSharing.weights
                : {};

        return {
            mode: 'tiered',
            weights
        };
    }

    return {
        mode: 'equal'
    };
}


// Export controllers
module.exports = {
    listTrips,
    getTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    getTripSettlementsForTrip,
    listParticipantsForTrip,
    createParticipantForTrip,
    listBookingsForTrip,
    createBookingForTrip
};