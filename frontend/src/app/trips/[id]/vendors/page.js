"use client";

import { useState } from "react";
import { Card, Pill, Avatar, Money, PageHeader } from "@/components/ui/Shared";
import { VENDORS, PARTICIPANTS, inr } from "@/lib/constants";

export default function VendorsPage() {
  const [view, setView] = useState("vendor");
  return (
    <div className="p-8 max-w-6xl">
      <PageHeader title="Financial View" />
      <div className="flex gap-2 mb-6 -mt-2">
        <button onClick={() => setView("person")} className="px-4 py-2 rounded-lg text-sm font-medium" style={view === "person" ? { background: "#EEEBFA", color: "#5B4B9E" } : { color: "#8A8580" }}>By Person</button>
        <button onClick={() => setView("vendor")} className="px-4 py-2 rounded-lg text-sm font-medium" style={view === "vendor" ? { background: "#EEEBFA", color: "#5B4B9E" } : { color: "#8A8580" }}>By Vendor</button>
      </div>
      {view === "vendor" ? (
        <div className="grid grid-cols-2 gap-4">
          {VENDORS.map((v) => (
            <Card key={v.name} className="p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">{v.name}</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs"><span className="text-gray-500">Total billed</span><span className="font-medium text-gray-900">{inr(v.billed)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-gray-500">Paid to vendor</span><span className="font-medium text-gray-900">{inr(v.paid)}</span></div>
                {v.refund > 0 && <div className="flex justify-between text-xs items-center"><span className="text-gray-500">Refund pending</span><Pill tone="pending">{inr(v.refund)}</Pill></div>}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          {PARTICIPANTS.map((p, i) => (
            <div key={p.name} className="flex justify-between items-center px-4 py-3.5" style={{ borderBottom: i < PARTICIPANTS.length - 1 ? "1px solid #F3F2EF" : "none" }}>
              <div className="flex items-center gap-3"><Avatar name={p.name} /><span className="text-sm font-medium text-gray-900">{p.name}</span></div>
              <div className="flex gap-6">
                <Money label="Total share" amount={p.share} />
                <Money label={p.balance >= 0 ? "Owes" : "Receivable"} amount={p.balance} tone={p.balance >= 0 ? "pending" : "success"} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
