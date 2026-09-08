require('dotenv').config();

const { addEvent } = require('./eventLog');

const SAMPLE_BOOKING_ID = '33333333-3333-3333-3333-333333333333';

async function run() {
    try {
        const event = await addEvent(
            SAMPLE_BOOKING_ID,
            'participant_added_to_booking',
            {
                participant_id: '22222222-2222-2222-2222-222222222222'
            }
        );

        console.log('Event created:');
        console.log(event);

    } catch (err) {
        console.error('addEvent failed:', err.message);
    }
}

run();