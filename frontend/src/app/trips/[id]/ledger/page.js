import { Card, Pill, PageHeader } from "@/components/ui/Shared";
import { LEDGER_EVENTS } from "@/lib/constants";

export default function LedgerPage() {
  return (
    <div className="p-8 max-w-6xl">
      <PageHeader title="Living Ledger" />
      <Card className="p-5 mb-6" style={{ background: "#FBE7E9" }}>
        <p className="text-xs font-medium mb-1" style={{ color: "#B24C56" }}>Edge case — Rahul's departure</p>
        <p className="text-sm" style={{ color: "#8A3B43" }}>Rahul left after Day 3. His ₹3,000 hotel share was ₹1,800 refundable / ₹1,200 non-refundable — refunded to Priya, redistributed to Room 3.</p>
      </Card>
      <div className="space-y-2">
        {LEDGER_EVENTS.map((e, i) => (
          <Card key={i} className="p-4 flex items-center justify-between"><p className="text-sm text-gray-900">{e.text}</p><Pill tone={e.tone}>{e.time}</Pill></Card>
        ))}
      </div>
    </div>
  );
}
