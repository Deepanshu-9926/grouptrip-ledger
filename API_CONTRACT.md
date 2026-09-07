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
  "phone" : "9876543210",
  "role" : "Member"
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

# 10. Frontend Integration Notes

Frontend should use the backend API for:

- Financial calculations
- Participant shares
- Refunds
- Booking cancellations
- Booking cost changes
- Settlement calculations
- UPI payment links

Frontend should mainly handle:

- Forms
- User interaction
- Displaying data
- Calling APIs
- Loading states
- Error states

The frontend must not duplicate the Living Ledger,
recompute financial balances, or implement the settlement algorithm.

The intended data flow is:

USER INPUT
    ↓
FRONTEND
    ↓
BACKEND API
    ↓
LIVING LEDGER / EVENT LOG
    ↓
DATABASE
    ↓
RECOMPUTATION
    ↓
FINANCIAL SUMMARY / SETTLEMENT
    ↓
FRONTEND DISPLAY

---

### GET /api/trips/:tripId/spending-summary

Returns day-by-day trip spending grouped by booking category.

**Response:**

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

# 11. Frontend Environment Variable

Create a `.env.local` file in the frontend project:

NEXT_PUBLIC_API_URL=http://localhost:5000