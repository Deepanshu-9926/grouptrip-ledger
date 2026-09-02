-- ============================================================
-- GroupTrip Ledger — Sample Seed Data
-- Uses the demo trip story: Mumbai -> Manali, college trip
-- Run this AFTER schema.sql
-- ============================================================

-- 1. A trip
INSERT INTO trips (id, name, destination, start_date, end_date)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'College Trip', 'Manali', '2026-12-10', '2026-12-15');

-- 2. Participants (2 of the 12, enough to test relationships)
INSERT INTO participants (id, trip_id, name, phone, upi_id, role)
VALUES
    ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Aditi Sharma', '9876543210', 'aditi@upi', 'Organizer'),
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Rahul Verma', '9876543211', 'rahul@upi', 'Member');

-- 3. A booking (hotel room, partially refundable — used for edge case testing later)
INSERT INTO bookings (id, trip_id, category, vendor_name, total_cost, booking_datetime, refund_policy, refundable_amount, cancellation_deadline, status)
VALUES
    ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Accommodation', 'Snow Valley Resort', 3000.00, '2026-12-13 14:00:00+05:30', 'partially_refundable', 1800.00, '2026-12-12 12:00:00+05:30', 'active');

-- 4. Both participants assigned to that booking
INSERT INTO booking_participants (booking_id, participant_id)
VALUES
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222221'),
    ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222');

-- 5. A payment (Aditi paid the hotel on behalf of the group)
INSERT INTO payments (payer_id, booking_id, amount, paid_at)
VALUES
    ('22222222-2222-2222-2222-222222222221', '33333333-3333-3333-3333-333333333333', 3000.00, '2026-12-01 10:00:00+05:30');

-- 6. Events (the audit trail for this booking so far)
INSERT INTO events (booking_id, event_type, payload)
VALUES
    ('33333333-3333-3333-3333-333333333333', 'booking_added', '{"vendor": "Snow Valley Resort", "total_cost": 3000.00}'),
    ('33333333-3333-3333-3333-333333333333', 'participant_added_to_booking', '{"participant_id": "22222222-2222-2222-2222-222222222221"}'),
    ('33333333-3333-3333-3333-333333333333', 'participant_added_to_booking', '{"participant_id": "22222222-2222-2222-2222-222222222222"}'),
    ('33333333-3333-3333-3333-333333333333', 'payment_logged', '{"payer_id": "22222222-2222-2222-2222-222222222221", "amount": 3000.00}');

