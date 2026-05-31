"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard",    icon: "dashboard",     label: "Dashboard" },
  { href: "/cases",        icon: "folder_open",   label: "Cases" },
  { href: "/evidence",     icon: "inventory_2",   label: "Evidence" },
  { href: "/lab",          icon: "science",       label: "Lab" },
  { href: "/audit",        icon: "history_edu",   label: "Audit" },
  { href: "/personnel",    icon: "badge",         label: "Personnel" },
  { href: "/disclosure",   icon: "gavel",         label: "Disclosure" },
  { href: "/ai-summaries", icon: "auto_awesome",  label: "AI Summaries" },
  { href: "/database",     icon: "schema",        label: "Database" },
  { href: "/settings",     icon: "settings",      label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-outline-variant flex flex-col py-lg px-md z-50">
      {/* Brand */}
      <div className="flex items-center gap-3 mb-xl">
        {/* Logo mark */}
        <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shrink-0 shadow-sm">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L4 5.5V11C4 15.418 7.536 19.591 12 21C16.464 19.591 20 15.418 20 11V5.5L12 2Z" fill="#bec6e0" fillOpacity="0.25"/>
            <path d="M12 2L4 5.5V11C4 15.418 7.536 19.591 12 21C16.464 19.591 20 15.418 20 11V5.5L12 2Z" stroke="#bec6e0" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M9 11.5L11 13.5L15 9.5" stroke="#0051d5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h1 className="text-[15px] font-bold leading-tight tracking-tight text-on-surface">CustodyCore</h1>
          <p className="text-[9px] font-bold tracking-[0.12em] uppercase text-on-surface-variant mt-0.5">Forensic Management</p>
        </div>
      </div>

      {/* New Evidence CTA */}
      <Link
        href="/evidence/new"
        className="w-full bg-secondary text-on-secondary rounded-lg py-2 px-md flex items-center justify-center gap-2 mb-lg hover:opacity-90 transition-opacity active:scale-95 duration-150 text-[13px] font-semibold shadow-sm"
      >
        <span className="material-symbols-outlined text-[17px]">add</span>
        New Evidence Entry
      </Link>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto space-y-[2px]">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-sm py-2 rounded-lg transition-colors active:scale-95 duration-150 text-[13px] ${
                active
                  ? "bg-surface-container-low text-secondary font-bold border-r-[3px] border-secondary"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
              }`}
            >
              <span className={`material-symbols-outlined text-[19px] ${active ? "fill" : ""}`}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-lg border-t border-outline-variant mt-auto space-y-1">
        <Link
          href="/support"
          className="flex items-center gap-3 px-sm py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors text-[13px]"
        >
          <span className="material-symbols-outlined text-[19px]">help_outline</span>
          <span>Support</span>
        </Link>
        <div className="flex items-center gap-3 px-sm py-2">
          <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold text-on-secondary shrink-0">
            JD
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-on-surface truncate">J. Doe</p>
            <p className="text-[9px] font-bold tracking-[0.1em] uppercase text-on-surface-variant truncate">Chief Custodian</p>
          </div>
        </div>
      </div>
    </nav>
  );
}
