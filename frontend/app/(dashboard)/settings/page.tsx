"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";

interface HealthResponse {
  version?: string;
  nodeVersion?: string;
  uptime?: number;
  dbStatus?: string;
  environment?: string;
  status?: string;
}

const API_ENDPOINTS = [
  { route: "/api/dashboard/stats",       method: "GET",  desc: "Dashboard KPIs & recent transfers" },
  { route: "/api/cases",                 method: "GET",  desc: "List + create cases" },
  { route: "/api/cases/:id",             method: "GET",  desc: "Case detail" },
  { route: "/api/cases/:id/close",       method: "POST", desc: "Close a case" },
  { route: "/api/evidence",              method: "GET",  desc: "List + create evidence" },
  { route: "/api/evidence/:id/audit",    method: "GET",  desc: "Chain-of-custody trail" },
  { route: "/api/evidence/:id/transfer", method: "POST", desc: "Record custody transfer" },
  { route: "/api/lab-tests",             method: "GET",  desc: "Lab test requests" },
  { route: "/api/lab-tests/turnaround",  method: "GET",  desc: "Avg turnaround per test type" },
  { route: "/api/lab-tests/:id/complete",method: "POST", desc: "Mark test complete + results" },
  { route: "/api/custody-transfers",     method: "GET",  desc: "All custody transfers" },
  { route: "/api/personnel",             method: "GET",  desc: "Staff directory" },
  { route: "/api/personnel/:id/deactivate", method: "POST", desc: "Deactivate staff member" },
  { route: "/api/evidence-requests",     method: "GET",  desc: "Disclosure requests" },
  { route: "/api/evidence-requests/:id/approve", method: "POST", desc: "Approve request" },
  { route: "/api/evidence-requests/:id/deny",    method: "POST", desc: "Deny request" },
  { route: "/api/disclosure-logs",       method: "GET",  desc: "Defense viewing logs" },
  { route: "/api/ai-summaries",          method: "GET",  desc: "AI-generated case briefs" },
  { route: "/api/ai-summaries/generate", method: "POST", desc: "Generate new AI brief" },
  { route: "/api/evidence-types",        method: "GET",  desc: "Evidence type lookup" },
  { route: "/api/storage-locations",     method: "GET",  desc: "Storage location lookup" },
  { route: "/api/courts",                method: "GET",  desc: "Court lookup" },
  { route: "/api/auth/google",           method: "GET",  desc: "Google OAuth — redirects to Google" },
  { route: "/api/auth/callback",         method: "GET",  desc: "OAuth callback — sets session" },
  { route: "/api/health",                method: "GET",  desc: "Health check" },
];

export default function SettingsPage() {
  const [saved, setSaved]     = useState(false);
  const [health, setHealth]   = useState<HealthResponse | null>(null);
  const [apiOk, setApiOk]     = useState<boolean | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  useEffect(() => {
    fetch("/api/health")
      .then((r) => { setApiOk(r.ok); return r.json(); })
      .then((d) => setHealth(d))
      .catch(() => { setApiOk(false); setHealth(null); });
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const formatUptime = (s?: number) => {
    if (!s) return "—";
    return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-800">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">System configuration and API endpoint reference</p>
      </div>

      {/* Connection status banner */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${apiOk === null ? "bg-neutral-50 border-neutral-200 text-neutral-500" : apiOk ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
        <span className="material-symbols-outlined text-[18px]">{apiOk === null ? "wifi" : apiOk ? "check_circle" : "wifi_off"}</span>
        {apiOk === null ? "Checking backend connection…" : apiOk ? `Backend connected at ${apiUrl}` : `Cannot reach backend at ${apiUrl} — start your Node.js server`}
      </div>

      {/* API Config */}
      <div className="bg-white rounded-xl border border-neutral-100 p-6">
        <h2 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-secondary">api</span>
          API Configuration
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-neutral-600">Backend API URL</label>
            <div className="mt-1 flex gap-2">
              <input value={apiUrl} readOnly
                className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-sm font-mono bg-neutral-50 text-neutral-600" />
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Set via <code className="bg-neutral-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> in <code className="bg-neutral-100 px-1 rounded">.env.local</code>.
              All <code className="bg-neutral-100 px-1 rounded">/api/*</code> requests are proxied to this URL via Next.js rewrites.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Save size={14} />{saved ? "Saved!" : "Save"}
            </button>
            {saved && <span className="text-xs text-green-600">✓ Config updated</span>}
          </div>
        </form>
      </div>

      {/* System Info */}
      {health && (
        <div className="bg-white rounded-xl border border-neutral-100 p-6">
          <h2 className="text-sm font-semibold text-neutral-700 mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-secondary">info</span>
            System Information
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "App Version",   value: health.version ?? "—" },
              { label: "Environment",   value: health.environment ?? "—" },
              { label: "Node Version",  value: health.nodeVersion ?? "—" },
              { label: "Server Uptime", value: formatUptime(health.uptime) },
              { label: "Database",      value: health.dbStatus ?? "—" },
              { label: "API Status",    value: health.status ?? "ok" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-neutral-50 rounded-lg p-3">
                <p className="text-xs text-neutral-400 uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-medium mt-0.5 ${value === "ok" || value === "Connected" ? "text-green-600" : "text-neutral-700"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full endpoint reference */}
      <div className="bg-white rounded-xl border border-neutral-100 p-6">
        <h2 className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-secondary">route</span>
          Backend Endpoint Reference
        </h2>
        <p className="text-xs text-neutral-500 mb-4">
          All calls from this frontend go to these endpoints. Implement them in your Node.js backend at <code className="bg-neutral-100 px-1 rounded">{apiUrl}</code>.
        </p>
        <div className="space-y-1">
          {API_ENDPOINTS.map(({ route, method, desc }) => (
            <div key={route} className="flex items-center gap-3 text-xs py-1.5 border-b border-neutral-50 last:border-0">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 w-10 text-center ${method === "GET" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{method}</span>
              <code className="text-secondary font-mono bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">{route}</code>
              <span className="text-neutral-500">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
