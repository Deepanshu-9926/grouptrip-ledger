"use client";

import { TONE, HEADING, HOW_IT_WORKS, FAQS } from "@/lib/constants";
import { Logo } from "@/components/Logo";

export function Btn({ variant = "primary", children, onClick, className = "", type = "button" }) {
  const t = TONE[variant] || TONE.primary;
  return (
    <button type={type} onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium active:scale-[0.98] transition-all duration-150 hover:brightness-95 hover:shadow-sm ${className}`}
      style={{ background: t.bg, color: t.text, border: `1px solid ${t.border}` }}>{children}</button>
  );
}

export function Card({ children, className = "", style = {} }) {
  return <div className={`bg-white rounded-3xl ${className}`} style={{ boxShadow: "0 1px 4px rgba(20,20,20,0.05)", ...style }}>{children}</div>;
}

export function Pill({ tone = "neutral", children }) {
  const t = TONE[tone] || TONE.neutral;
  return <span className="px-2.5 py-1 rounded-md text-xs font-medium" style={{ background: t.bg, color: t.text }}>{children}</span>;
}

export function Avatar({ name, size = 32 }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return <div className="rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: "#EEEBFA", color: "#5B4B9E", width: size, height: size }}>{initials}</div>;
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900" style={HEADING}>{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <input {...props} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-gray-400" />
    </label>
  );
}

export function Toast({ toasts }) {
  return (
    <div className="fixed bottom-24 right-5 space-y-2 z-[60]">
      {toasts.map((t) => {
        const tone = TONE[t.tone] || TONE.success;
        return <div key={t.id} className="px-4 py-3 rounded-xl shadow-md text-sm font-medium" style={{ background: tone.bg, color: tone.text, border: `1px solid ${tone.border}` }}>{t.msg}</div>;
      })}
    </div>
  );
}

export function Money({ label, amount, tone = "neutral" }) {
  const t = TONE[tone];
  return (
    <div className="text-right">
      <p className="text-[11px] text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold" style={{ color: tone === "neutral" ? "#1A1A1A" : t.text }}>₹{Math.abs(amount).toLocaleString("en-IN")}</p>
    </div>
  );
}

export function PageHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl text-gray-900" style={HEADING}>{title}</h2>
      {action}
    </div>
  );
}

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Logo className="h-20 mb-6" />
      <Card className="w-full max-w-sm p-8">
        <h2 className="text-xl font-semibold text-gray-900" style={HEADING}>{title}</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">{subtitle}</p>
        {children}
        <p className="text-xs text-gray-500 mt-5 text-center">{footer}</p>
      </Card>
    </div>
  );
}

export function HowItWorksModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="How It Works">
      <ol className="space-y-3">
        {HOW_IT_WORKS.map((s, i) => (
          <li key={s} className="flex gap-3 text-sm text-gray-700">
            <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </Modal>
  );
}

/* Not currently triggered from anywhere (its header "?" trigger was removed
   in an earlier v-series pass) — kept available for whenever it's reattached,
   e.g. inside Penny. */
export function HelpModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="Help & Questions">
      <div className="space-y-3 mb-4">
        {FAQS.map((f) => (
          <div key={f.q}>
            <p className="text-sm font-medium text-gray-900">{f.q}</p>
            <p className="text-xs text-gray-500 mt-0.5">{f.a}</p>
          </div>
        ))}
      </div>
      <Field label="Still have a question?" placeholder="Type your question…" />
      <Btn variant="primary" className="w-full py-2">Send</Btn>
    </Modal>
  );
}