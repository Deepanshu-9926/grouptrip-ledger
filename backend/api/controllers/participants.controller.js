const pool = require('../../db/db');

// GET /api/participants/:id
async function getParticipant(req, res) {
    try {
        const result = await pool.query(
            'SELECT * FROM participants WHERE id = $1',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        res.status(200).json({ data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch participant' });
    }
}


// PUT /api/participants/:id
async function updateParticipant(req, res) {
    const { name, phone, upi_id, role } = req.body;

    if (!name || !phone) {
        return res.status(400).json({
            error: 'name and phone are required'
        });
    }

    try {
        const result = await pool.query(
            `UPDATE participants
             SET name = $1,
                 phone = $2,
                 upi_id = $3,
                 role = COALESCE($4, role)
             WHERE id = $5
             RETURNING *`,
            [
                name,
                phone,
                upi_id || null,
                role,
                req.params.id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Participant not found'
            });
        }

        res.status(200).json({ data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(400).json({
            error: 'Failed to update participant — check your input values'
        });
    }
}


// DELETE /api/participants/:id
async function deleteParticipant(req, res) {
    try {
        const result = await pool.query(
            'DELETE FROM participants WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Participant not found'
            });
        }

        res.status(200).json({
            data: { id: result.rows[0].id }
        });

    } catch (err) {
        // payments.payer_id uses ON DELETE RESTRICT
        if (err.code === '23503') {
            return res.status(400).json({
                error: 'Cannot delete participant: they have payment records tied to them'
            });
        }

        console.error(err);
        res.status(500).json({
            error: 'Failed to delete participant'
        });
    }
}


module.exports = {
    getParticipant,
    updateParticipant,
    deleteParticipant
};