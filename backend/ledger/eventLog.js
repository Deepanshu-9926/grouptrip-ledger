const pool = require('../db/db');

const ALLOWED_EVENT_TYPES = [
    'booking_added',
    'participant_added_to_booking',
    'participant_removed_from_booking',
    'payment_logged',
    'booking_cancelled',
    'refund_issued',
    'booking_cost_modified'
];

async function addEvent(bookingId, eventType, payload, client = pool) {
    if (!bookingId) {
        throw new Error('addEvent: bookingId is required');
    }

    if (!eventType) {
        throw new Error('addEvent: eventType is required');
    }

    if (!ALLOWED_EVENT_TYPES.includes(eventType)) {
        throw new Error(
            `addEvent: "${eventType}" is not a valid event type. ` +
            `Allowed types: ${ALLOWED_EVENT_TYPES.join(', ')}`
        );
    }

    if (!payload || typeof payload !== 'object') {
        throw new Error(
            'addEvent: payload is required and must be an object'
        );
    }

    const result = await client.query(
        `INSERT INTO events (booking_id, event_type, payload)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [bookingId, eventType, payload]
    );

    return result.rows[0];
}

module.exports = {
    addEvent
};