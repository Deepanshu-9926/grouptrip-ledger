"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Btn, HowItWorksModal } from "@/components/ui/Shared";
import { TRIP_TYPES, HEADING } from "@/lib/constants";

function TripIcon({ type, active, delay = 0 }) {
  const cls = `w-12 h-12 md:w-14 md:h-14 ts-float transition-all duration-500 ${active ? "text-[#7A3426] scale-125 -translate-y-2 drop-shadow-lg" : "text-gray-300 scale-100"}`;
  const style = { animationDelay: `${delay}ms` };
  if (type === "globe") return (
    <svg viewBox="0 0 24 24" fill="none" className={cls} style={style}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M3 12h18M12 3c2.5 2.5 3.8 6 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-6-3.8-9s1.3-6.5 3.8-9z" stroke="currentColor" strokeWidth="1.8" /></svg>
  );
  if (type === "car") return (
    <svg viewBox="0 0 24 24" fill="none" className={cls} style={style}><path d="M4 16l1.5-5.5A2 2 0 0 1 7.4 9h9.2a2 2 0 0 1 1.9 1.5L20 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="16" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.8" /><circle cx="7.5" cy="20" r="1.3" fill="currentColor" /><circle cx="16.5" cy="20" r="1.3" fill="currentColor" /></svg>
  );
  if (type === "grad") return (
    <svg viewBox="0 0 24 24" fill="none" className={cls} style={style}><path d="M12 4L2 9l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M6 11.5V16c0 1.5 2.5 3 6 3s6-1.5 6-3v-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cls} style={style}><path d="M4 11l8-6 8 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 10v9h12v-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="17" cy="6" r="1.6" stroke="currentColor" strokeWidth="1.4" /></svg>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [showHow, setShowHow] = useState(false);
  const [tripType, setTripType] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [logoIn, setLogoIn] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLogoIn(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordVisible(false);
      setTimeout(() => {
        setTripType((i) => (i + 1) % TRIP_TYPES.length);
        setWordVisible(true);
      }, 250);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <style>{`
        @keyframes tsFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        .ts-float { animation: tsFloat 3.2s ease-in-out infinite; }
      `}</style>
      <header className="flex items-center justify-end px-10 py-6">
        <button
          onClick={() => setShowHow(true)}
          className="px-4 py-1.5 rounded-full border border-[#E0C3AC] bg-[#F1DCCB] text-[#8A5236] text-sm font-medium transition-all duration-200 hover:bg-[#E7CBB4] hover:shadow-sm active:scale-95 active:bg-[#DBB99C]"
        >
          How It Works
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start pt-8 md:pt-14 text-center px-6">
        <img
          src="/TripSync.logo_2.jpg"
          alt="TripSync"
          className={`h-56 md:h-80 object-contain mx-auto mb-1 transition-all duration-700 ease-out ${logoIn ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95"}`}
        />

        <h2 className="text-xl md:text-2xl text-gray-800" style={HEADING}>
          A ledger for your{" "}
          <span
            className={`inline-block text-[#5B4B9E] transition-all duration-300 ${wordVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
          >
            {TRIP_TYPES[tripType]}
          </span>{" "}
          that updates itself.
        </h2>

        <div className="flex items-center gap-6 mt-5">
          <TripIcon type="globe" active={tripType === 0} delay={0} />
          <TripIcon type="car" active={tripType === 1} delay={150} />
          <TripIcon type="grad" active={tripType === 2} delay={300} />
          <TripIcon type="house" active={tripType === 3} delay={450} />
        </div>

        <p className="text-gray-500 mt-5 max-w-md text-sm leading-relaxed">
          When someone joins, leaves, or a booking changes, TripSync recalculates every
          balance automatically — and shows you exactly why.
        </p>
        <button
          onClick={() => router.push("/signup")}
          style={{ backgroundColor: "#CE8B6E" }}
          className="px-8 py-3.5 rounded-xl border border-[#B97552]/40 bg-[#CE8B6E] text-white text-lg font-semibold shadow-md transition-all duration-200 hover:bg-[#B97552] hover:shadow-lg hover:-translate-y-0.5 active:scale-95 active:bg-[#A6633F] mt-8"
        >
          Get Started
        </button>
      </main>
      <HowItWorksModal open={showHow} onClose={() => setShowHow(false)} />
    </div>
  );
}