"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { dashboardApi, type DashboardStats } from "@/lib/api";

const KPI_DEFS = [
  { label: "Active Cases",      key: "total_active_cases" as const,  icon: "folder_open",      color: "bg-blue-50 text-blue-600" },
  { label: "Pending Lab Tests", key: "pending_lab_tests" as const,   icon: "science",           color: "bg-purple-50 text-purple-600" },
  { label: "Items In Transit",  key: "items_in_transit" as const,    icon: "local_shipping",    color: "bg-orange-50 text-orange-600" },
  { label: "Disposal Alerts",   key: "disposal_alerts" as const,     icon: "warning",           color: "bg-red-50 text-red-600" },
];

// Shown when backend is unreachable
const PLACEHOLDER_STATS: DashboardStats = {
  total_active_cases:  0,
  pending_lab_tests:   0,
  items_in_transit:    0,
  disposal_alerts:     0,
  recent_transfers:    [],
  lab_turnaround:      [
    { test_type: "DNA",           avg_days: 0, target_days: 14 },
    { test_type: "Fingerprint",   avg_days: 0, target_days: 5  },
    { test_type: "Toxicology",    avg_days: 0, target_days: 21 },
    { test_type: "Digital",       avg_days: 0, target_days: 10 },
  ],
  case_backlog_by_priority: [
    { priority: "Critical", count: 0 },
    { priority: "Major",    count: 0 },
    { priority: "Minor",    count: 0 },
  ],
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(PLACEHOLDER_STATS);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    dashboardApi.getStats()
      .then((data) => {
        setStats(data);
        setApiError(false);
      })
      .catch(() => {
        setApiError(true);
        setStats(PLACEHOLDER_STATS);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Command Center</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Overview of active forensic assets — {new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}
          </p>
        </div>
        {apiError && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
            <span className="material-symbols-outlined text-sm">wifi_off</span>
            Backend unreachable — showing placeholders
          </div>
        )}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-600 hover:bg-neutral-50 transition-colors">
            <span className="material-symbols-outlined text-[15px]">calendar_today</span>
            Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-600 hover:bg-neutral-50 transition-colors">
            <span className="material-symbols-outlined text-[15px]">download</span>
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_DEFS.map(({ label, key, icon, color }) => (
          <div key={key} className="bg-white rounded-xl border border-neutral-100 p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              <span className="material-symbols-outlined text-xl">{icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-800">
                {loading ? <span className="inline-block w-8 h-6 bg-neutral-100 rounded animate-pulse" /> : stats[key] ?? 0}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Case Backlog Chart — from API */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-100 p-5">
          <h2 className="text-sm font-semibold text-neutral-700 mb-4">Case Backlog by Priority</h2>
          {loading ? (
            <div className="h-48 bg-neutral-50 rounded-lg animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.case_backlog_by_priority} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="priority" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }} />
                <Bar dataKey="count" name="Cases" fill="#0051d5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
          {apiError && (
            <p className="text-xs text-center text-neutral-400 mt-2">
              Connect backend at <code className="bg-neutral-100 px-1 rounded">/api/dashboard/stats</code> to populate
            </p>
          )}
        </div>

        {/* Lab Turnaround — from API */}
        <div className="bg-white rounded-xl border border-neutral-100 p-5">
          <h2 className="text-sm font-semibold text-neutral-700 mb-4">Lab Turnaround (Avg Days)</h2>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-8 bg-neutral-50 rounded animate-pulse" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {stats.lab_turnaround.map(({ test_type, avg_days, target_days }) => (
                <div key={test_type}>
                  <div className="flex justify-between text-xs text-neutral-600 mb-1">
                    <span>{test_type}</span>
                    <span className={`font-medium ${avg_days > target_days ? "text-red-600" : "text-neutral-700"}`}>
                      {avg_days}d / {target_days}d target
                    </span>
                  </div>
                  <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${avg_days > target_days ? "bg-red-500" : "bg-secondary"}`}
                      style={{ width: target_days > 0 ? `${Math.min((avg_days / target_days) * 100, 100)}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transfers — from API */}
      <div className="bg-white rounded-xl border border-neutral-100">
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-neutral-700">Recent Custody Transfers</h2>
          <a href="/audit" className="text-xs text-secondary hover:underline">View all →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                <th className="px-5 py-3 text-left">Asset Tag</th>
                <th className="px-5 py-3 text-left">From</th>
                <th className="px-5 py-3 text-left">To</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-neutral-400 text-xs">Loading…</td></tr>
              ) : stats.recent_transfers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <span className="material-symbols-outlined text-2xl block mx-auto mb-2 text-neutral-300">swap_horiz</span>
                    <p className="text-xs text-neutral-400">No transfers yet — connect your backend to see data</p>
                  </td>
                </tr>
              ) : (
                stats.recent_transfers.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-5 py-3 font-mono text-xs text-secondary">{t.evidence_item?.asset_tag ?? `#${t.evidence_item_id}`}</td>
                    <td className="px-5 py-3 text-neutral-700">{t.from_personnel?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-neutral-700">{t.to_personnel?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-xs text-neutral-500 capitalize">{t.transfer_type?.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 text-neutral-500">{new Date(t.transfer_timestamp).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
