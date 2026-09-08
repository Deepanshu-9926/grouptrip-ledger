# GroupTrip Ledger — API Contract

## Base URL

Local development:

http://localhost:5000

Demo Trip ID:

11111111-1111-1111-1111-111111111111

---

# 1. Trips

## Get all trips

GET /api/trips

## Get one trip

GET /api/trips/:id

## Create trip

POST /api/trips

Body:

{
  "name": "Manali College Trip",
  "destination": "Manali",
  "start_date": "2026-09-10",
  "end_date": "2026-09-14"
}

## Update trip

PUT /api/trips/:id

## Delete trip

DELETE /api/trips/:id

---

# 2. Trip Participants

## Get participants

GET /api/trips/:tripId/participants

## Add participant

POST /api/trips/:tripId/participants

Body:

{
  "name": "Rahul Verma",
  "upi_id": "rahul@upi",
  "phone": "9876543210",
  "role": "Member"
}

Required fields:

- name
- phone

Optional fields:

- upi_id
- role

If role is omitted, the backend defaults it to `Member`.

---

# 3. Trip Bookings

## Get bookings

GET /api/trips/:tripId/bookings

## Create booking

POST /api/trips/:tripId/bookings

Example body:

{
  "vendor_name": "ABC Hotel",
  "category": "Accommodation",
  "total_cost": 5000,
  "booking_datetime": "2026-09-10T10:00:00",
  "refund_policy": "50% refundable",
  "refundable_amount": 2500,
  "cancellation_deadline": "2026-09-08T23:59:59"
}

Possible category values:

- Accommodation
- Transport
- Activity
- Other

---

# 4. Booking Details

## Get booking

GET /api/bookings/:id

## Update booking

PUT /api/bookings/:id

Example body:

{
  "total_cost": 5000
}

When the total cost changes, the backend records a
`booking_cost_modified` event in the Living Ledger.

## Cancel booking

POST /api/bookings/:id/cancel

No body required.

Cancellation is recorded as a `booking_cancelled` event.

---

# 5. Booking Participants

## Add participant to booking

POST /api/bookings/:bookingId/participants

Body:

{
  "participant_id": "participant-id"
}

This records a `participant_added_to_booking` event.

## Remove participant from booking

DELETE /api/bookings/:bookingId/participants/:participantId

This records a `participant_removed_from_booking` event.

---

# 6. Booking Payments

## Get payments for booking

GET /api/bookings/:bookingId/payments

## Add payment

POST /api/bookings/:bookingId/payments

Body:

{
  "payer_participant_id": "participant-id",
  "amount": 2500,
  "paid_at": "2026-09-07"
}

The database stores `payer_participant_id` as `payer_id`.

The backend also records a `payment_logged` event.

---

# 7. Trip Financial Summary

## Get financial summary

GET /api/trips/:tripId/financial-summary

The backend calculates:

- Total amount owed by each participant
- Total amount paid by each participant
- Net balance
- Booking-level financial state
- Refund impact
- Cancellation impact
- Cost modification impact

The frontend should NOT calculate these values itself.

The frontend should display the values returned by the backend.

---

# 8. Settlements

## Get minimum settlements

GET /api/trips/:tripId/settlements

The backend calculates the minimum set of payments required to settle the trip.

The response also includes:

- Payer
- Receiver
- Settlement amount
- UPI payment link

The frontend should display these results rather than implementing its own settlement algorithm.

UPI links are generated as UPI deep links.

No real payment gateway is used.

---

# 9. Error Response

API errors use this format:

{
  "error": "Error message"
}

---

# 10. Spending Summary

## Get spending summary

GET /api/trips/:tripId/spending-summary

Returns day-by-day trip spending grouped by booking category.

Response:

```json
{
  "trip_id": "11111111-1111-1111-1111-111111111111",
  "daily_spending": [
    {
      "date": "2026-12-09",
      "day": 1,
      "transport": 0,
      "accommodation": 0,
      "activities": 0,
      "other": 0,
      "total": 0
    }
  ]
}
```

The spending summary is calculated by the backend using the
effective booking cost after refunds and cancellations.

The frontend should display these values rather than
recalculating spending itself.

---

# 11. Audit Events

## Get booking event history

GET /api/bookings/:bookingId/events

Returns the immutable event history for a booking.

The response includes:

- Event sequence number
- Event type
- Event payload
- Event creation timestamp

Events may include:

- booking_added
- participant_added_to_booking
- participant_removed_from_booking
- payment_logged
- refund_issued
- booking_cancelled
- booking_cost_modified

The sequence number represents the deterministic order used by
the Living Ledger when replaying events.

Example response:

{
  "data": [
    {
      "sequence": "17",
      "event_type": "booking_added",
      "payload": {
        "booking_id": "booking-id"
      },
      "created_at": "2026-09-04T20:10:24.611Z"
    }
  ]
}

The frontend should use this endpoint to display an audit trail.

It should not modify or reorder ledger events.

---

# 12. Vendor Reconciliation Ledger

## Get vendor ledger

GET /api/trips/:tripId/vendors

Returns vendor-level financial information for the trip.

The response includes:

- Vendor name
- Total amount billed
- Amount paid
- Refund pending
- Outstanding amount

Example response:

{
  "trip_id": "11111111-1111-1111-1111-111111111111",
  "vendors": [
    {
      "vendor_name": "ABC Hotel",
      "total_billed": 5000,
      "amount_paid": 5000,
      "refund_pending": 0,
      "outstanding": 0
    }
  ]
}

The backend derives these values from booking state and
Living Ledger events.

The frontend should display these values and should not
recalculate vendor balances itself.

---

# 13. Frontend Environment Variable

Create a `.env.local` file in the frontend project:

NEXT_PUBLIC_API_URL=http://localhost:5000

## Trip Invites

### Create Invite

**POST** `/api/trips/:tripId/invites`

Creates a shareable invite link for a specific trip.

Request body:

```json
{
  "created_by": "participant-uuid"
}

Response `201`:

```json
{
  "invite_id": "invite-uuid",
  "trip_id": "trip-uuid",
  "invite_link": "http://localhost:3000/join/<token>",
  "expires_at": "2026-09-15T18:35:51.443Z"
}

### Get Invite Details

**GET** `/api/invites/:token`

Used by the frontend join page to validate an invite and display the trip information before joining.

Response `200`:

```json
{
  "data": {
    "trip_id": "trip-uuid",
    "trip_name": "College Trip",
    "destination": "Manali",
    "start_date": "2026-12-09",
    "end_date": "2026-12-14",
    "expires_at": "2026-09-15T18:35:51.443Z"
  }
}

### Join Trip Using Invite

**POST** `/api/invites/:token/join`

Adds a new participant to the trip associated with the invite.

Request body:

```json
{
  "name": "Test Member",
  "phone": "9999999999",
  "upi_id": "testmember@upi"
}

Response `201`:

```json
{
  "data": {
    "participant": {},
    "trip_id": "trip-uuid",
    "message": "Successfully joined the trip"
  }
}

Possible errors:

- `400` — Name, phone, or UPI ID missing
- `404` — Invite or trip not found
- `410` — Invite expired or revoked

Important:

Joining a trip through an invite only creates a trip participant. It does not automatically add the participant to any existing booking or activity.

The participant will affect booking costs only when explicitly added to that booking.