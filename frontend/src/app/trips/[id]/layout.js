import { Sidebar } from "@/components/workspace/Sidebar";
import { Header } from "@/components/workspace/Header";

export default function TripLayout({ children }) {
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      {/* Full-width workspace header */}
      <Header />

      {/* Sidebar + page content */}
      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <main className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}