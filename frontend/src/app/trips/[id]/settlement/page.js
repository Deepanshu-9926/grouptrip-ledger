"use client";

import { useState } from "react";
import { Card, Pill, Avatar, Modal, Field, Btn, PageHeader } from "@/components/ui/Shared";
import { useToast } from "@/components/ToastProvider";
import { SETTLEMENTS, HEADING, inr } from "@/lib/constants";

export default function SettlementPage() {
  const toast = useToast();
  const [items, setItems] = useState(SETTLEMENTS.map((s) => ({ ...s, remaining: s.amount, status: "pending" })));
  const [selected, setSelected] = useState(null);
  const [payInput, setPayInput] = useState("");

  const openPay = (item) => { setSelected(item); setPayInput(""); };
  const submitPay = () => {
    const amt = Number(payInput);
    if (!amt || amt <= 0) return;
    setItems((prev) => prev.map((it) => {
      if (it !== selected) return it;
      const remaining = Math.max(0, it.remaining - amt);
      return { ...it, remaining, status: remaining === 0 ? "settled" : "partial" };
    }));
    toast(amt >= selected.remaining ? "Marked as settled" : "Partial payment recorded", "success");
    setSelected(null);
  };

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader title="Settlement" />
      <p className="text-sm text-gray-500 -mt-4 mb-6">Minimum transactions to settle everyone up.</p>
      <Card>
        {items.map((s, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50/50" style={{ borderBottom: i < items.length - 1 ? "1px solid #F3F2EF" : "none" }} onClick={() => s.status !== "settled" && openPay(s)}>
            <div className="flex items-center gap-3 text-sm">
              <Avatar name={s.from} size={30} /><span className="font-medium text-gray-900">{s.from}</span>
              <span className="text-gray-500">owes</span><span className="font-medium text-gray-900">{s.to}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">{inr(s.remaining)}</span>
              <Pill tone={s.status === "settled" ? "success" : s.status === "partial" ? "pending" : "neutral"}>
                {s.status === "settled" ? "Settled" : s.status === "partial" ? "Partially Paid" : "Pending"}
              </Pill>
            </div>
          </div>
        ))}
      </Card>

      <Modal open={!!selected} onClose={() => setSelected(null)} title="Settle Up">
        {selected && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Amount owed</p>
            <p className="text-2xl font-semibold text-gray-900 mb-5" style={HEADING}>{inr(selected.remaining)}</p>
            <Field label="Amount to pay" type="number" placeholder="0" value={payInput} onChange={(e) => setPayInput(e.target.value)} />
            <Btn variant="primary" className="w-full py-2.5" onClick={submitPay}>Pay</Btn>
          </div>
        )}
      </Modal>
    </div>
  );
}
