"use client";

import { useState } from "react";

import {
  Btn,
  Card,
  Pill,
  Avatar,
  Modal,
  Field,
  Money,
  PageHeader,
} from "@/components/ui/Shared";

import { useToast } from "@/components/ToastProvider";
import { PARTICIPANTS } from "@/lib/constants";

export default function ParticipantsPage() {
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="p-8 max-w-6xl">
      <PageHeader
        title="Participants"
        action={
          <Btn
            variant="primary"
            onClick={() => setShowAdd(true)}
          >
            + Add
          </Btn>
        }
      />

      <Card>
        {PARTICIPANTS.map((p, i) => (
          <div
            key={p.name}
            className="flex items-center justify-between px-4 py-3.5"
            style={{
              borderBottom:
                i < PARTICIPANTS.length - 1
                  ? "1px solid #F3F2EF"
                  : "none",
            }}
          >
            <div className="flex items-center gap-3">
              <Avatar name={p.name} />

              <div>
                <p className="text-sm font-medium text-gray-900">
                  {p.name}{" "}
                  {p.role === "Organizer" && (
                    <Pill tone="primary">Organizer</Pill>
                  )}
                </p>

                {p.note && (
                  <p className="text-xs text-gray-500">
                    {p.note}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-6">
              <Money
                label="Current share"
                amount={p.share}
              />

              <Money
                label="Paid"
                amount={p.paid}
                tone="success"
              />

              <Money
                label={
                  p.balance >= 0
                    ? "Owes"
                    : "Receivable"
                }
                amount={p.balance}
                tone={
                  p.balance >= 0
                    ? "pending"
                    : "success"
                }
              />
            </div>
          </div>
        ))}
      </Card>

      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Participant"
      >
        <Field
          label="Name"
          placeholder="Full name"
        />

        <Field
          label="Phone number"
          placeholder="98xxxxxxxx"
        />

        <Field
          label="UPI ID"
          placeholder="example@upi"
        />

        <Btn
          variant="primary"
          className="w-full py-2.5 mt-2"
          onClick={() => {
            setShowAdd(false);
            toast("Participant added", "success");
          }}
        >
          Add Participant
        </Btn>
      </Modal>
    </div>
  );
}