-- ============================================================
-- GroupTrip Ledger — Core Database Schema
-- Branch: feature/db-schema
-- Tables: trips, participants, bookings, booking_participants,
--         payments, events
-- ============================================================

-- Required for UUID generation (gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. trips
-- ------------------------------------------------------------
CREATE TABLE trips (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT trips_dates_valid CHECK (end_date >= start_date)
);

-- ------------------------------------------------------------
-- 2. participants
-- ------------------------------------------------------------
CREATE TABLE participants (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id    UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL,
    upi_id     TEXT,
    role       TEXT NOT NULL DEFAULT 'Member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT participants_role_valid CHECK (role IN ('Organizer', 'Member'))
);

CREATE INDEX idx_participants_trip_id ON participants(trip_id);

-- ------------------------------------------------------------
-- 3. bookings
-- ------------------------------------------------------------
CREATE TABLE bookings (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id                UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    category               TEXT NOT NULL,
    vendor_name            TEXT NOT NULL,
    total_cost             NUMERIC(12, 2) NOT NULL,
    booking_datetime       TIMESTAMPTZ NOT NULL,
    refund_policy          TEXT NOT NULL DEFAULT 'non_refundable',
    refundable_amount      NUMERIC(12, 2) NOT NULL DEFAULT 0,
    cancellation_deadline  TIMESTAMPTZ,
    status                 TEXT NOT NULL DEFAULT 'active',
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT bookings_category_valid CHECK (
        category IN ('Transport', 'Accommodation', 'Activities', 'Other')
    ),
    CONSTRAINT bookings_refund_policy_valid CHECK (
        refund_policy IN ('fully_refundable', 'partially_refundable', 'non_refundable')
    ),
    CONSTRAINT bookings_status_valid CHECK (
        status IN ('active', 'cancelled')
    ),
    CONSTRAINT bookings_total_cost_non_negative CHECK (total_cost >= 0),
    CONSTRAINT bookings_refundable_amount_non_negative CHECK (refundable_amount >= 0),
    CONSTRAINT bookings_refundable_amount_within_total CHECK (refundable_amount <= total_cost)
);

CREATE INDEX idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ------------------------------------------------------------
-- 4. booking_participants
--    (join table: which participants are part of which booking)
-- ------------------------------------------------------------
CREATE TABLE booking_participants (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT booking_participants_unique UNIQUE (booking_id, participant_id)
);

CREATE INDEX idx_booking_participants_booking_id ON booking_participants(booking_id);
CREATE INDEX idx_booking_participants_participant_id ON booking_participants(participant_id);

-- ------------------------------------------------------------
-- 5. payments
-- ------------------------------------------------------------
CREATE TABLE payments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_id   UUID NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount     NUMERIC(12, 2) NOT NULL,
    paid_at    TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT payments_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_payer_id ON payments(payer_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);

-- ------------------------------------------------------------
-- 6. events
--    (append-only log — source of truth for the ledger engine)
-- ------------------------------------------------------------
CREATE TABLE events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
    sequence BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT events_type_valid CHECK (
        event_type IN (
            'booking_added',
            'participant_added_to_booking',
            'participant_removed_from_booking',
            'payment_logged',
            'booking_cancelled',
            'refund_issued',
            'booking_cost_modified'
        )
    )
);

CREATE INDEX idx_events_booking_id ON events(booking_id);
CREATE INDEX idx_events_created_at ON events(created_at);
