"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { NAV } from "@/lib/constants";

export function Sidebar() {
  const pathname = usePathname();
  const { id } = useParams();

  return (
    <div className="w-20 shrink-0 h-full flex flex-col items-center justify-center">
      <div className="bg-white rounded-full shadow-sm p-2 flex flex-col items-center gap-1">
        {NAV.map((item) => {
          const href = item.key === "overview" ? `/trips/${id}` : `/trips/${id}/${item.key}`;
          const active = pathname === href;
          return (
            <Link
              key={item.key}
              href={href}
              title={item.label}
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm leading-none transition-colors hover:bg-gray-100"
              style={active ? { background: "#1A1A1A", color: "#fff" } : { color: "#8A8580" }}
            >
              <span className="flex items-center justify-center w-full h-full">{item.icon}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
