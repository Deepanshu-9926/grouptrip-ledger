/* ============================= DESIGN TOKENS ============================= */
export const TONE = {
  primary:   { bg: "#EEEBFA", text: "#5B4B9E", border: "#DFDAF3" },
  secondary: { bg: "#F4F1EC", text: "#7A6E5A", border: "#E9E3D8" },
  info:      { bg: "#E6EFFB", text: "#3D6AA6", border: "#D3E4F5" },
  success:   { bg: "#E6F3EB", text: "#3F8A5C", border: "#D3EBDD" },
  pending:   { bg: "#FBF3D9", text: "#9A7B1F", border: "#F3E5AE" },
  danger:    { bg: "#FBE7E9", text: "#B24C56", border: "#F5D3D8" },
  neutral:   { bg: "#F5F4F2", text: "#6B6660", border: "#E9E7E2" },
};

export const HEADING = { fontFamily: "var(--font-plus-jakarta), -apple-system, sans-serif", fontWeight: 700, letterSpacing: "-0.02em" };

/* ============================= MOCK DATA (Mumbai -> Manali demo story) ============================= */
export const PARTICIPANTS = [
  { name: "Priya Shah", role: "Organizer", share: 22500, paid: 57000, balance: -34500 },
  { name: "Rahul Mehta", role: "Member", share: 3200, paid: 3000, balance: 200, note: "Left after Day 3" },
  { name: "Aman Verma", role: "Member", share: 22900, paid: 3200, balance: 19700 },
  { name: "Riya Kapoor", role: "Member", share: 18900, paid: 0, balance: 18900 },
  { name: "Karan Joshi", role: "Member", share: 22400, paid: 5000, balance: 17400 },
  { name: "Rohan Gupta", role: "Member", share: 15650, paid: 2000, balance: 13650 },
];

export const BOOKINGS_BY_DAY = [
  { day: "Day 1", date: "12 Sep", items: [
    { name: "Mumbai → Manali (Train)", category: "Transport", cost: 36000, status: "paid", paidBy: "Priya Shah", people: 12 },
    { name: "Hotel Snow Valley — check-in", category: "Accommodation", cost: 98000, status: "partial", paidBy: "Priya Shah", people: 12 },
  ]},
  { day: "Day 2", date: "13 Sep", items: [
    { name: "Paragliding", category: "Activities", cost: 25000, status: "partial", paidBy: "Aman Verma", people: 5 },
  ]},
  { day: "Day 3", date: "14 Sep", items: [
    { name: "River Rafting", category: "Activities", cost: 18600, status: "paid", paidBy: "Karan Joshi", people: 8 },
  ]},
  { day: "Day 4–5", date: "15–17 Sep", items: [
    { name: "Local market + return cab", category: "Transport", cost: 26000, status: "paid", paidBy: "Priya Shah", people: 12 },
  ]},
];

export const VENDORS = [
  { name: "Hotel Snow Valley", billed: 98000, paid: 96200, refund: 1800 },
  { name: "Cab Operator", billed: 26000, paid: 26000, refund: 0 },
  { name: "Paragliding Co.", billed: 25000, paid: 22000, refund: 0 },
];

export const SETTLEMENTS = [
  { from: "Aman Verma", to: "Priya Shah", amount: 19700 },
  { from: "Rohan Gupta", to: "Priya Shah", amount: 13650 },
];

export const PAYMENTS = [
  { who: "Organizer (Priya)", amount: 42000, note: "Cab — paid for group", status: "success" },
  { who: "Priya Shah", amount: 15000, note: "Hotel Snow Valley", status: "success" },
  { who: "Aman Verma", amount: 3200, note: "River Rafting", status: "success" },
  { who: "Rohan Gupta", amount: 2000, note: "Group meals", status: "pending" },
];

export const LEDGER_EVENTS = [
  { text: "Rahul removed from Room 3 — remaining roommates' share increased by ₹150 each", time: "Day 3, 6:40 PM", tone: "pending" },
  { text: "Refund issued — ₹1,800 returned to Priya (payer)", time: "Day 3, 6:41 PM", tone: "success" },
  { text: "₹1,200 non-refundable portion redistributed across Room 3", time: "Day 3, 6:41 PM", tone: "pending" },
  { text: "Payment logged — ₹15,000 towards Hotel Snow Valley", time: "Day 1, 9:12 AM", tone: "success" },
];

export const TRIPS_ACTIVE = [
  { name: "Manali College Trip", route: "Mumbai → Manali", people: 12, dates: "12–17 Sep 2026", outstanding: 47200 },
  { name: "Goa Friends Trip", route: "Pune → Goa", people: 6, dates: "2–5 Oct 2026", outstanding: 3200 },
];
export const TRIPS_PAST = [
  { name: "Rajasthan Trip", route: "Delhi → Jaipur", people: 8, dates: "Mar 2026" },
  { name: "Lonavala Weekend", route: "Mumbai → Lonavala", people: 5, dates: "Jan 2026" },
];

export const HOW_IT_WORKS = [
  "Create or join a trip",
  "Add bookings and participants",
  "Track who paid",
  "Changes automatically update the ledger",
  "Settle balances at the end",
];

export const FAQS = [
  { q: "How does the ledger recalculate?", a: "Every change — a join, leave, refund, or payment — is stored as an event. Balances are always derived fresh from that history." },
  { q: "Can I edit a payment after logging it?", a: "Not yet in this version — log a correcting entry instead, and it will show clearly in the audit trail." },
  { q: "What happens to vendor payments?", a: "The Vendors tab shows exactly what's billed, paid, and refund-pending per vendor, independent of who owes whom personally." },
];

export const NAV = [
  { key: "overview", label: "Overview", icon: "◉" },
  { key: "itinerary", label: "Itinerary", icon: "▤" },
  { key: "participants", label: "Participants", icon: "◐" },
  { key: "payments", label: "Payments", icon: "◈" },
  { key: "ledger", label: "Ledger", icon: "◫" },
  { key: "vendors", label: "Vendors", icon: "◧" },
  { key: "settlement", label: "Settlement", icon: "◔" },
];

export const STATUS_TONE = { paid: "success", partial: "pending", unpaid: "danger", refund_pending: "pending", refunded: "info" };
export const STATUS_LABEL = { paid: "Paid", partial: "Partially Paid", unpaid: "Unpaid", refund_pending: "Refund Pending", refunded: "Refunded" };

/* Overview chart data */
export const DAILY_SPEND = [
  { day: "Day 1", segments: [{ cat: "Transport", value: 36000, color: "#9AC2E8" }, { cat: "Accommodation", value: 98000, color: "#B7A9E8" }] },
  { day: "Day 2", segments: [{ cat: "Activities", value: 25000, color: "#A9DDBB" }] },
  { day: "Day 3", segments: [{ cat: "Activities", value: 18600, color: "#A9DDBB" }] },
  { day: "Day 4–5", segments: [{ cat: "Transport", value: 26000, color: "#9AC2E8" }] },
];
export const DAY_TOTAL = (d) => d.segments.reduce((s, seg) => s + seg.value, 0);
export const CHART_MAX = Math.max(...DAILY_SPEND.map(DAY_TOTAL));

/* Landing page dynamic tagline words */
export const TRIP_TYPES = ["group trip", "weekend getaway", "college reunion", "family vacation"];

export const inr = (n) => "₹" + Math.abs(n).toLocaleString("en-IN");

/* Mock logged-in user — account/profile info only, intentionally separate
   from PARTICIPANTS (which holds trip financial data for the same person). */
export const CURRENT_USER = {
  name: "Priya Shah",
  email: "priya.shah@example.com",
  phone: "+91 98xxxxxx01",
  upiId: "priya@upi",
};