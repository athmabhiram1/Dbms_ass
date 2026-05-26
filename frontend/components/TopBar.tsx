"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Clock } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/cases": "Cases",
  "/evidence": "Evidence",
  "/lab": "Lab Tests",
  "/audit": "Audit Trail",
  "/personnel": "Personnel",
  "/disclosure": "Disclosure",
  "/ai-summaries": "AI Summaries",
  "/settings": "Settings",
};

export default function TopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "CustodyCore";

  return (
    <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400 font-medium uppercase tracking-widest">
          CustodyCore
        </span>
        <span className="text-neutral-300">/</span>
        <span className="text-sm font-semibold text-neutral-800">{title}</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={15} className="absolute left-3 text-neutral-400" />
          <input
            type="text"
            placeholder="Search cases, evidence…"
            className="pl-8 pr-4 py-1.5 text-sm bg-neutral-50 border border-neutral-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent placeholder:text-neutral-400"
          />
        </div>

        {/* History */}
        <button
          className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
          title="Recent activity"
        >
          <Clock size={18} />
        </button>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
          title="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-white text-xs font-bold select-none">
            AD
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-neutral-800 leading-none">
              Admin
            </p>
            <p className="text-xs text-neutral-400 leading-none mt-0.5">
              Detective
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
