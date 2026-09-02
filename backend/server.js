require('dotenv').config();

const express = require('express');
const pool = require('./db/db');

const app = express();

const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() AS current_time');

        res.json({
            status: 'ok',
            database: 'connected',
            time: result.rows[0].current_time
        });
    } catch (error) {
        console.error('Database connection error:', error);

        res.status(500).json({
            status: 'error',
            database: 'connection failed'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});