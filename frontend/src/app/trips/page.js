"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Btn,
  Card,
  Pill,
  Field,
  Money,
  Modal,
} from "@/components/ui/Shared";

import { Logo } from "@/components/Logo";
import { useToast } from "@/components/ToastProvider";
import {
  TRIPS_ACTIVE,
  TRIPS_PAST,
  HEADING,
} from "@/lib/constants";

function TripRow({ t, past, onOpen }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0 cursor-pointer hover:bg-gray-50/50"
      onClick={onOpen}
    >
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {t.name}
        </p>

        <p className="text-xs text-gray-500 mt-0.5">
          {t.route} · {t.people} participants · {t.dates}
        </p>
      </div>

      {past ? (
        <Pill tone="success">Settled</Pill>
      ) : (
        <Money
          label="Outstanding"
          amount={t.outstanding}
          tone={t.outstanding > 0 ? "pending" : "success"}
        />
      )}
    </div>
  );
}

export default function MyTripsPage() {
  const router = useRouter();
  const toast = useToast();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [created, setCreated] = useState(false);
  const [joinMethod, setJoinMethod] = useState("search");

  // Workspace route
  const openWorkspace = () => {
    router.push("/trips/manali-trip");
  };

  return (
    <div className="min-h-screen relative">
      {/* TripSync logo — moved to upper-left and enlarged */}
      <div className="absolute top-6 left-6 md:top-7 md:left-8 z-10">
         <Logo className="h-16 md:h-20 w-auto object-contain" />
      </div>

      <div className="max-w-5xl mx-auto px-8 py-28 md:py-32">
        <div className="flex justify-between items-center mb-8">
          <h1
            className="text-2xl text-gray-900"
            style={HEADING}
          >
            My Trips
          </h1>

          <div className="flex gap-2">
            <Btn
              variant="secondary"
              onClick={() => setShowJoin(true)}
            >
              Join a Trip
            </Btn>

            <Btn
              variant="primary"
              onClick={() => setShowCreate(true)}
            >
              + Create Trip
            </Btn>
          </div>
        </div>

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Active & Upcoming
        </p>

        <Card className="mb-8">
          {TRIPS_ACTIVE.map((t) => (
            <TripRow
              key={t.name}
              t={t}
              onOpen={openWorkspace}
            />
          ))}
        </Card>

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Past Trips
        </p>

        <Card>
          {TRIPS_PAST.map((t) => (
            <TripRow
              key={t.name}
              t={t}
              past
              onOpen={() => {}}
            />
          ))}
        </Card>
      </div>

      {/* Create Trip Modal */}
      <Modal
        open={showCreate}
        onClose={() => {
          setShowCreate(false);
          setCreated(false);
        }}
        title={created ? "Trip created" : "Create New Trip"}
      >
        {!created ? (
          <>
            <Field
              label="Trip name"
              placeholder="e.g. Manali College Trip"
            />

            <Field
              label="Starting location"
              placeholder="Mumbai"
            />

            <Field
              label="Destination"
              placeholder="Manali"
            />

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Start date"
                type="date"
              />

              <Field
                label="End date"
                type="date"
              />
            </div>

            <Btn
              variant="primary"
              className="w-full py-2.5 mt-2"
              onClick={() => setCreated(true)}
            >
              Create Trip
            </Btn>
          </>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Mumbai → Manali · 12 participants
            </p>

            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
              Trip Invite Link
            </p>

            <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between mb-4">
              <span className="text-sm font-mono text-gray-700">
                grouptrip.app/join/MT7X92
              </span>

              <button
                className="text-xs font-medium"
                style={{ color: "#5B4B9E" }}
                onClick={() => toast("Link copied", "success")}
              >
                Copy
              </button>
            </div>

            <div className="flex gap-2">
              <Btn
                variant="secondary"
                className="flex-1"
                onClick={() =>
                  toast("Share sheet opened", "info")
                }
              >
                Share
              </Btn>

              <Btn
                variant="primary"
                className="flex-1"
                onClick={() => {
                  setShowCreate(false);
                  setCreated(false);
                  openWorkspace();
                }}
              >
                Go to Trip
              </Btn>
            </div>
          </div>
        )}
      </Modal>

      {/* Join Trip Modal */}
      <Modal
        open={showJoin}
        onClose={() => setShowJoin(false)}
        title="Join a Trip"
      >
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setJoinMethod("search")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={
              joinMethod === "search"
                ? {
                    background: "#EEEBFA",
                    color: "#5B4B9E",
                  }
                : {
                    color: "#8A8580",
                  }
            }
          >
            Search
          </button>

          <button
            onClick={() => setJoinMethod("link")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium"
            style={
              joinMethod === "link"
                ? {
                    background: "#EEEBFA",
                    color: "#5B4B9E",
                  }
                : {
                    color: "#8A8580",
                  }
            }
          >
            Have a link?
          </button>
        </div>

        {joinMethod === "search" ? (
          <>
            <Field
              label="Search by trip name, destination, or code"
              placeholder="Mumbai → Manali"
            />

            <Card className="p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">
                Manali College Trip
              </p>

              <p className="text-xs text-gray-500">
                Mumbai → Manali · 12 participants
              </p>
            </Card>
          </>
        ) : (
          <Field
            label="Paste invite link"
            placeholder="grouptrip.app/join/..."
          />
        )}

        <Btn
          variant="primary"
          className="w-full py-2.5"
          onClick={() => {
            setShowJoin(false);
            toast("Joined trip", "success");
            openWorkspace();
          }}
        >
          Join Trip
        </Btn>
      </Modal>
    </div>
  );
}