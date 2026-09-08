"use client";

import { useRouter } from "next/navigation";
import { Btn, Field, AuthShell } from "@/components/ui/Shared";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see your trips"
      footer={<>New here? <span className="underline cursor-pointer" onClick={() => router.push("/signup")}>Create an account</span></>}
    >
      <Field label="Email" type="email" placeholder="you@example.com" />
      <Field label="Password" type="password" placeholder="••••••••" />
      <p className="text-xs text-gray-500 mb-4 cursor-pointer">Forgot password?</p>
      <Btn variant="primary" className="w-full py-2.5" onClick={() => { toast("Logged in", "success"); router.push("/trips"); }}>Log In</Btn>
    </AuthShell>
  );
}