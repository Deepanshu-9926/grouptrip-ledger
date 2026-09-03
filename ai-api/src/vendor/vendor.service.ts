export type BookingStatus = "confirmed" | "cancelled";

export interface VendorBooking {
  tripId: string;
  vendorName: string;
  billedAmount: number;
  paidAmount: number;
  refundPendingAmount: number;
  status: BookingStatus;
}

export interface VendorLedgerEntry {
  vendorName: string;
  totalBilled: number;
  amountPaid: number;
  refundPending: number;
  outstandingAmount: number;
}

export interface VendorLedgerResponse {
  success: true;
  tripId: string;
  vendors: VendorLedgerEntry[];
}

const mockBookings: VendorBooking[] = [
  {
    tripId: "trip_demo_001",
    vendorName: "Pine Ridge Resort",
    billedAmount: 54000,
    paidAmount: 30000,
    refundPendingAmount: 0,
    status: "confirmed",
  },
  {
    tripId: "trip_demo_001",
    vendorName: "CityRide Cabs",
    billedAmount: 18500,
    paidAmount: 18500,
    refundPendingAmount: 2500,
    status: "confirmed",
  },
  {
    tripId: "trip_demo_001",
    vendorName: "Summit Trails Adventures",
    billedAmount: 32000,
    paidAmount: 12000,
    refundPendingAmount: 4000,
    status: "confirmed",
  },
  {
    tripId: "trip_demo_001",
    vendorName: "Pine Ridge Resort",
    billedAmount: 6000,
    paidAmount: 6000,
    refundPendingAmount: 0,
    status: "cancelled",
  },
];

function createEmptyLedgerEntry(vendorName: string): VendorLedgerEntry {
  return {
    vendorName,
    totalBilled: 0,
    amountPaid: 0,
    refundPending: 0,
    outstandingAmount: 0,
  };
}

export async function getVendorLedger(
  tripId: string
): Promise<VendorLedgerResponse> {
  const ledger = new Map<string, VendorLedgerEntry>();

  for (const booking of mockBookings) {
    if (booking.tripId !== tripId) {
      continue;
    }

    const entry = ledger.get(booking.vendorName) ?? createEmptyLedgerEntry(booking.vendorName);
    entry.totalBilled += booking.billedAmount;
    entry.amountPaid += booking.paidAmount;
    entry.refundPending += booking.refundPendingAmount;
    entry.outstandingAmount = entry.totalBilled - entry.amountPaid;
    ledger.set(booking.vendorName, entry);
  }

  return {
    success: true,
    tripId,
    vendors: Array.from(ledger.values()),
  };
}