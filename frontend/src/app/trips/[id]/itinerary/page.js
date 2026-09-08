"use client";

import { useState } from "react";
import { Btn, Card, Pill, Modal, Field, PageHeader } from "@/components/ui/Shared";
import { useToast } from "@/components/ToastProvider";
import { BOOKINGS_BY_DAY, PARTICIPANTS, STATUS_TONE, STATUS_LABEL, inr } from "@/lib/constants";

const EMPTY_FORM = { name: "", category: "Transport", cost: "", people: "1", paidBy: PARTICIPANTS[0]?.name || "", status: "unpaid" };

export default function ItineraryPage() {
  const toast = useToast();
  // Local copy so the shared constants module is never mutated.
  const [days, setDays] = useState(() => BOOKINGS_BY_DAY.map((d) => ({ ...d, items: [...d.items] })));
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const openAdd = () => { setForm(EMPTY_FORM); setError(""); setShowAdd(true); };

  const submitAdd = () => {
    const name = form.name.trim();
    const cost = Number(form.cost);
    if (!name) { setError("Booking name is required."); return; }
    if (!cost || cost <= 0) { setError("Enter a valid total cost."); return; }

    const newBooking = {
      name,
      category: form.category,
      cost,
      status: form.status,
      paidBy: form.paidBy,
      people: Number(form.people) || 1,
    };

    setDays((prev) => {
      const next = prev.map((d) => ({ ...d, items: [...d.items] }));
      const targetDay = next[0]; // simple default grouping, per demo scope
      targetDay.items.push(newBooking);
      return next;
    });

    setShowAdd(false);
    toast("Booking added successfully", "success");
  };

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader title="Itinerary" action={<Btn variant="primary" onClick={openAdd}>+ Add Booking</Btn>} />
      <div className="space-y-6">
        {days.map((d) => (
          <div key={d.day}>
            <div className="flex items-baseline gap-2 mb-2">
              <p className="text-sm font-semibold text-gray-900">{d.day}</p>
              <p className="text-xs text-gray-500">{d.date}</p>
            </div>
            <Card>
              {d.items.map((b, i) => (
                <div key={b.name + i} className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50/50" style={{ borderBottom: i < d.items.length - 1 ? "1px solid #F3F2EF" : "none" }} onClick={() => setSelected(b)}>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.category} · {b.people} people</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">{inr(b.cost)}</span>
                    <Pill tone={STATUS_TONE[b.status]}>{STATUS_LABEL[b.status]}</Pill>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}
      </div>

      {/* Existing booking-details modal — unchanged, now also used for newly added bookings */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="text-sm space-y-3 text-gray-700">
            <div className="flex justify-between"><span className="text-gray-500">Total cost</span><span className="font-medium text-gray-900">{inr(selected.cost)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Paid by</span><span className="font-medium text-gray-900">{selected.paidBy}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Participants</span><span className="font-medium text-gray-900">{selected.people} people</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-500">Payment status</span><Pill tone={STATUS_TONE[selected.status]}>{STATUS_LABEL[selected.status]}</Pill></div>
          </div>
        )}
      </Modal>

      {/* New: Add Booking modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Booking">
        <Field label="Booking name" placeholder="e.g. Local sightseeing" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />

        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-500">Category</span>
          <select
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            <option>Transport</option>
            <option>Accommodation</option>
            <option>Activities</option>
            <option>Other</option>
          </select>
        </label>

        <Field label="Total cost (₹)" type="number" placeholder="0" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} />
        <Field label="Number of participants" type="number" placeholder="1" value={form.people} onChange={(e) => setForm((f) => ({ ...f, people: e.target.value }))} />

        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-500">Paid by</span>
          <select
            value={form.paidBy}
            onChange={(e) => setForm((f) => ({ ...f, paidBy: e.target.value }))}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            {PARTICIPANTS.map((p) => <option key={p.name}>{p.name}</option>)}
          </select>
        </label>

        <label className="block mb-3">
          <span className="text-xs font-medium text-gray-500">Payment status</span>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400 bg-white"
          >
            {Object.keys(STATUS_LABEL).map((key) => (
              <option key={key} value={key}>{STATUS_LABEL[key]}</option>
            ))}
          </select>
        </label>

        {error && <p className="text-xs mb-3" style={{ color: "#B24C56" }}>{error}</p>}

        <Btn variant="primary" className="w-full py-2.5" onClick={submitAdd}>Add Booking</Btn>
      </Modal>
    </div>
  );
}