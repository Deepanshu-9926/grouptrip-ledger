"use client";

import { useRouter } from "next/navigation";
import { Btn, Field, AuthShell } from "@/components/ui/Shared";
import { useToast } from "@/components/ToastProvider";

export default function SignupPage() {
  const router = useRouter();
  const toast = useToast();

  return (
    <AuthShell
      title="Create account"
      subtitle="Start tracking your group trips"
      footer={<>Already have an account? <span className="underline cursor-pointer" onClick={() => router.push("/login")}>Log In</span></>}
    >
      <Field label="Name" placeholder="Your name" />
      <Field label="Email" type="email" placeholder="you@example.com" />
      <Field label="Password" type="password" placeholder="••••••••" />
      <Btn variant="primary" className="w-full py-2.5" onClick={() => { toast("Account created", "success"); router.push("/trips"); }}>Create Account</Btn>
    </AuthShell>
  );
}