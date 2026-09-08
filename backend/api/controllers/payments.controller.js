const pool = require('../../db/db');

// DELETE /api/payments/:id
async function deletePayment(req, res) {
    try {
        const result = await pool.query(
            'DELETE FROM payments WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Payment not found'
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
            error: 'Failed to delete payment'
        });
    }
}

module.exports = {
    deletePayment
};