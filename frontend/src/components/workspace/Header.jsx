"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Btn,
  Avatar,
  Card,
  Modal,
  Field,
} from "@/components/ui/Shared";

import { Logo } from "@/components/Logo";
import { useToast } from "@/components/ToastProvider";
import { CURRENT_USER } from "@/lib/constants";

export function Header() {
  const toast = useToast();
  const router = useRouter();

  const [showAccount, setShowAccount] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [profile, setProfile] = useState(CURRENT_USER);
  const [editForm, setEditForm] = useState(CURRENT_USER);

  const openEdit = () => {
    setEditForm(profile);
    setShowEdit(true);
  };

  const saveEdit = () => {
    setProfile(editForm);
    setShowEdit(false);
    toast("Profile updated", "success");
  };

  const logout = () => {
    setShowAccount(false);
    toast("Logged out", "info");
    router.push("/login");
  };

  return (
    <header className="h-20 w-full shrink-0 bg-white/30 backdrop-blur-sm border-b border-white/50 relative z-30">
      <div className="h-full w-full flex items-center px-4 md:px-6 lg:px-8">
        {/* LEFT: TripSync branding */}
        <div className="shrink-0 flex items-center">
          <Logo className="h-14 md:h-16 w-auto object-contain" />
        </div>

        {/* CENTER: Trip information */}
        <div className="flex-1 min-w-0 flex items-center justify-center px-6">
          <div className="text-center">
            <p className="text-lg md:text-xl font-semibold tracking-tight text-gray-900 leading-tight">
              Manali College Trip
            </p>

            <p className="text-sm md:text-base text-gray-600 mt-1">
              Mumbai → Manali · 12–17 Sep · Day 4 of 5
            </p>
          </div>
        </div>

        {/* RIGHT: Invite + Personal Account */}
        <div className="shrink-0 flex items-center gap-3">
          <Btn
            variant="secondary"
            className="text-xs px-3 py-1.5"
            onClick={() => toast("Invite link copied", "info")}
          >
            Invite
          </Btn>

          <div className="relative">
            <button
              type="button"
              aria-label="Open personal account"
              aria-expanded={showAccount}
              onClick={() => setShowAccount((v) => !v)}
              className="rounded-full transition-transform duration-150 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#D8D0F0]"
            >
              <Avatar name={profile.name} size={38} />
            </button>

            {showAccount && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowAccount(false)}
                />

                <Card className="absolute right-0 top-12 z-50 w-64 p-4">
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar name={profile.name} size={40} />

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {profile.name}
                      </p>

                      <p className="truncate text-xs text-gray-500">
                        {profile.email}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between gap-3">
                      <span className="text-gray-500">Phone</span>
                      <span className="text-right">
                        {profile.phone}
                      </span>
                    </div>

                    {profile.upiId && (
                      <div className="flex justify-between gap-3">
                        <span className="text-gray-500">
                          UPI ID
                        </span>
                        <span className="text-right">
                          {profile.upiId}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Btn
                      variant="secondary"
                      className="w-full text-xs"
                      onClick={() => {
                        setShowAccount(false);
                        openEdit();
                      }}
                    >
                      Edit Profile
                    </Btn>

                    <Btn
                      variant="danger"
                      className="w-full text-xs"
                      onClick={logout}
                    >
                      Logout
                    </Btn>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Edit Profile"
      >
        <Field
          label="Name"
          value={editForm.name}
          onChange={(e) =>
            setEditForm((f) => ({
              ...f,
              name: e.target.value,
            }))
          }
        />

        <Field
          label="Email"
          value={editForm.email}
          disabled
        />

        <Field
          label="Phone"
          value={editForm.phone}
          onChange={(e) =>
            setEditForm((f) => ({
              ...f,
              phone: e.target.value,
            }))
          }
        />

        <Field
          label="UPI ID"
          value={editForm.upiId}
          onChange={(e) =>
            setEditForm((f) => ({
              ...f,
              upiId: e.target.value,
            }))
          }
        />

        <Btn
          variant="primary"
          className="w-full py-2.5 mt-2"
          onClick={saveEdit}
        >
          Save Changes
        </Btn>
      </Modal>
    </header>
  );
}