require('dotenv').config();

const express = require('express');

const tripsRoutes = require('./api/routes/trips.routes');
const participantsRoutes = require('./api/routes/participants.routes');
const bookingsRoutes = require('./api/routes/bookings.routes');
const paymentsRoutes = require('./api/routes/payments.routes');

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/trips', tripsRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});