const pool = require('../../db/db');

// ============================================================
// GET /api/invites/:token
// Get invite details before joining
// ============================================================

async function getInviteDetails(req, res) {
    const { token } = req.params;

    try {
        const result = await pool.query(
            `SELECT
                ti.id,
                ti.trip_id,
                ti.created_at,
                ti.expires_at,
                t.name AS trip_name,
                t.destination,
                t.start_date,
                t.end_date
             FROM trip_invites ti
             JOIN trips t ON t.id = ti.trip_id
             WHERE ti.token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Invite not found'
            });
        }

        const invite = result.rows[0];

        if (invite.expires_at <= new Date()) {
            return res.status(410).json({
                error: 'Invite has expired'
            });
        }

        res.status(200).json({
            data: {
                trip_id: invite.trip_id,
                trip_name: invite.trip_name,
                destination: invite.destination,
                start_date: invite.start_date,
                end_date: invite.end_date,
                expires_at: invite.expires_at
            }
        });

    } catch (err) {
        console.error('Get invite details error:', err);

        res.status(500).json({
            error: 'Failed to fetch invite'
        });
    }
}


// ============================================================
// POST /api/invites/:token/join
// Join a trip using an invite
// ============================================================

async function joinTripByInvite(req, res) {
    const { token } = req.params;
    const { name, phone, upi_id } = req.body;

    if (!name || !phone || !upi_id) {
        return res.status(400).json({
            error: 'name, phone and upi_id are required'
        });
    }

    try {
        // Find and validate the invite.
        const inviteResult = await pool.query(
            `SELECT
                ti.id,
                ti.trip_id,
                ti.expires_at,
                ti.revoked_at
             FROM trip_invites ti
             WHERE ti.token = $1`,
            [token]
        );

        if (inviteResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Invite not found'
            });
        }

        const invite = inviteResult.rows[0];

        if (invite.revoked_at) {
            return res.status(410).json({
                error: 'Invite has been revoked'
            });
        }

        if (invite.expires_at <= new Date()) {
            return res.status(410).json({
                error: 'Invite has expired'
            });
        }

        // Make sure the trip still exists.
        const tripResult = await pool.query(
            'SELECT id FROM trips WHERE id = $1',
            [invite.trip_id]
        );

        if (tripResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Trip not found'
            });
        }

        // Create the participant as a normal Member.
        const participantResult = await pool.query(
            `INSERT INTO participants
                (trip_id, name, phone, upi_id, role)
             VALUES ($1, $2, $3, $4, 'Member')
             RETURNING *`,
            [
                invite.trip_id,
                name,
                phone,
                upi_id || null
            ]
        );

        res.status(201).json({
            data: {
                participant: participantResult.rows[0],
                trip_id: invite.trip_id,
                message: 'Successfully joined the trip'
            }
        });

    } catch (err) {
        console.error('Join trip by invite error:', err);

        res.status(500).json({
            error: 'Failed to join trip'
        });
    }
}


module.exports = {
    getInviteDetails,
    joinTripByInvite
};