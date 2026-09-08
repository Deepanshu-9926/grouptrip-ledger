import { Card, Pill, PageHeader, Money } from "@/components/ui/Shared";
import { LEDGER_EVENTS, DAILY_SPEND, DAY_TOTAL, CHART_MAX, inr } from "@/lib/constants";

export default function OverviewPage() {
  const total = 245600, paid = 198400, outstanding = 47200;
  return (
    <div className="p-8 max-w-6xl">
      <PageHeader title="Overview" />
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card className="p-5"><p className="text-xs text-gray-500">Total trip cost</p><p className="text-xl font-semibold text-gray-900 mt-1">{inr(total)}</p></Card>
        <Card className="p-5"><Money label="Total paid" amount={paid} tone="success" /></Card>
        <Card className="p-5"><Money label="Outstanding" amount={outstanding} tone="pending" /></Card>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-6" style={{ background: "#1A1A1A" }}>
          <p className="text-white text-sm font-medium">Daily trip spending</p>
          <p className="text-xs text-gray-500 mb-4">Total booking spend by day</p>
          <div className="flex gap-4 text-xs text-gray-500 mb-6">
            <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#9AC2E8" }} />Transport</span>
            <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#B7A9E8" }} />Accommodation</span>
            <span><span className="inline-block w-2 h-2 rounded-full mr-1" style={{ background: "#A9DDBB" }} />Activities</span>
          </div>
          <div className="flex items-end gap-4 h-28">
            {DAILY_SPEND.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center justify-end h-full">
                <p className="text-[11px] text-gray-300 mb-1">{inr(DAY_TOTAL(d))}</p>
                <div className="w-full flex flex-col-reverse rounded-md overflow-hidden" style={{ height: `${(DAY_TOTAL(d) / CHART_MAX) * 100}%` }}>
                  {d.segments.map((seg) => (
                    <div key={seg.cat} title={`${seg.cat}: ${inr(seg.value)}`} style={{ height: `${(seg.value / DAY_TOTAL(d)) * 100}%`, background: seg.color }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            {DAILY_SPEND.map((d) => <p key={d.day} className="flex-1 text-center text-[11px] text-gray-500">{d.day}</p>)}
          </div>
        </Card>
        <Card className="p-5" style={{ background: "#FBF3D9" }}>
          <p className="text-xs font-medium mb-3" style={{ color: "#9A7B1F" }}>Living Ledger — recent</p>
          {LEDGER_EVENTS.slice(0, 3).map((e, i) => <p key={i} className="text-xs mb-2 leading-relaxed" style={{ color: "#7A6421" }}>{e.text}</p>)}
        </Card>
      </div>
    </div>
  );
}
