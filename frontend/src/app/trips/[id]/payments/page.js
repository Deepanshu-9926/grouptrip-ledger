"use client";

import { useState } from "react";
import { Btn, Card, Pill, Modal, Field, PageHeader } from "@/components/ui/Shared";
import { useToast } from "@/components/ToastProvider";
import { PAYMENTS, inr } from "@/lib/constants";

export default function PaymentsPage() {
  const toast = useToast();
  const [showLog, setShowLog] = useState(false);
  return (
    <div className="p-8 max-w-6xl">
      <PageHeader title="Payments" action={<Btn variant="primary" onClick={() => setShowLog(true)}>Log Payment</Btn>} />
      <Card>
        {PAYMENTS.map((p, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: i < PAYMENTS.length - 1 ? "1px solid #F3F2EF" : "none" }}>
            <div><p className="text-sm font-medium text-gray-900">{p.who}</p><p className="text-xs text-gray-500">{p.note}</p></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900">{inr(p.amount)}</span>
              <Pill tone={p.status === "success" ? "success" : "pending"}>{p.status === "success" ? "Recorded" : "Pending"}</Pill>
            </div>
          </div>
        ))}
      </Card>
      <Modal open={showLog} onClose={() => setShowLog(false)} title="Log Payment">
        <Field label="Payer" placeholder="Select participant" />
        <Field label="Amount (₹)" type="number" placeholder="0" />
        <Field label="Booking" placeholder="Select booking" />
        <label className="flex items-center gap-2 text-xs text-gray-500 mb-4"><input type="checkbox" /> Paid on behalf of the group</label>
        <Btn variant="primary" className="w-full py-2.5" onClick={() => { setShowLog(false); toast("Payment recorded successfully", "success"); }}>Log Payment</Btn>
      </Modal>
    </div>
  );
}
