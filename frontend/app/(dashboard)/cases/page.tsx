"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { casesApi, type Case } from "@/lib/api";
import { Plus, Search } from "lucide-react";

const PRIORITIES = ["", "critical", "major", "minor"];
const STATUSES   = ["", "open", "active", "closed"];

const priorityColor: Record<string, string> = {
  minor:    "text-neutral-400",
  major:    "text-orange-600",
  critical: "text-red-600",
};

export default function CasesPage() {
  const [cases, setCases]             = useState<Case[]>([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatus]     = useState("");
  const [priorityFilter, setPriority] = useState("");
  const [selected, setSelected]       = useState<Case | null>(null);
  const [showCreate, setShowCreate]   = useState(false);
  const [saving, setSaving]           = useState(false);
  const [form, setForm]               = useState({
    case_number: "", status: "open" as Case["status"],
    case_priority: "major" as Case["case_priority"],
    prosecutor_id: "", defense_id: "", court_id: "", hearing_date: "",
  });

  const load = () => {
    setLoading(true);
    casesApi.list({ status: statusFilter || undefined, priority: priorityFilter || undefined, search: search || undefined })
      .then((d) => { setCases(d.data); setTotal(d.total); })
      .catch(() => { setCases([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, priorityFilter]);

  const filtered = cases.filter(
    (c) => c.case_number?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await casesApi.create({
      ...form,
      prosecutor_id: Number(form.prosecutor_id) || undefined,
      defense_id:    Number(form.defense_id)    || undefined,
      court_id:      Number(form.court_id)      || undefined,
      hearing_date:  form.hearing_date || null,
    } as Partial<Case>).catch(() => {});
    setSaving(false);
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Cases</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{total} total cases</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> New Case
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search case #…"
            className="pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary w-48" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
          <option value="">All Statuses</option>
          {STATUSES.slice(1).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select value={priorityFilter} onChange={(e) => setPriority(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
          <option value="">All Priorities</option>
          {PRIORITIES.slice(1).map((p) => <option key={p}>{p}</option>)}
        </select>
        <button onClick={load} className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-600">
          <span className="material-symbols-outlined text-[15px] align-middle">refresh</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider bg-neutral-50 border-b border-neutral-100">
                <th className="px-5 py-3 text-left">Case #</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Priority</th>
                <th className="px-5 py-3 text-left">Prosecutor</th>
                <th className="px-5 py-3 text-left">Hearing Date</th>
                <th className="px-5 py-3 text-left">Opened</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-neutral-400 text-xs">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center">
                  <span className="material-symbols-outlined text-2xl block mx-auto mb-2 text-neutral-300">folder_open</span>
                  <p className="text-xs text-neutral-400">No cases found — your backend endpoint: <code className="bg-neutral-100 px-1 rounded">/api/cases</code></p>
                </td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer" onClick={() => setSelected(c)}>
                    <td className="px-5 py-3 font-mono text-xs text-secondary font-semibold">{c.case_number}</td>
                    <td className="px-5 py-3"><StatusBadge status={c.status} /></td>
                    <td className={`px-5 py-3 capitalize font-medium text-xs ${priorityColor[c.case_priority] ?? ""}`}>{c.case_priority}</td>
                    <td className="px-5 py-3 text-neutral-600">{c.prosecutor?.name ?? `ID: ${c.prosecutor_id}`}</td>
                    <td className="px-5 py-3 text-neutral-500">{c.hearing_date ? new Date(c.hearing_date).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3 text-neutral-500">{new Date(c.opened_date).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail slide-in */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-neutral-200 z-40 flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800 font-mono">{selected.case_number}</h2>
            <button onClick={() => setSelected(null)} className="text-neutral-400 hover:text-neutral-700">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Status</p><StatusBadge status={selected.status} className="mt-1" /></div>
              <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Priority</p>
                <p className={`text-sm font-medium capitalize mt-1 ${priorityColor[selected.case_priority] ?? ""}`}>{selected.case_priority}</p></div>
            </div>
            {selected.prosecutor && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Prosecutor</p><p className="text-sm text-neutral-700 mt-1">{selected.prosecutor.name}</p></div>}
            {selected.defense && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Defense</p><p className="text-sm text-neutral-700 mt-1">{selected.defense.name}</p></div>}
            {selected.court && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Court</p><p className="text-sm text-neutral-700 mt-1">{selected.court.name}</p></div>}
            {selected.hearing_date && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Hearing Date</p><p className="text-sm text-neutral-700 mt-1">{new Date(selected.hearing_date).toLocaleDateString()}</p></div>}
            <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Evidence Items</p><p className="text-sm text-neutral-700 mt-1">{selected.evidence_count ?? "—"}</p></div>
          </div>
          <div className="px-5 py-4 border-t border-neutral-100 flex gap-2">
            <a href={`/evidence?case_id=${selected.id}`}
              className="flex-1 flex items-center justify-center gap-2 bg-secondary text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <span className="material-symbols-outlined text-base">inventory_2</span> View Evidence
            </a>
            <button onClick={async () => { await casesApi.close(selected.id).catch(() => {}); setSelected(null); load(); }}
              className="px-3 py-2 border border-neutral-200 rounded-lg text-xs text-neutral-600 hover:bg-neutral-50">
              Close Case
            </button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Case" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="text-xs font-medium text-neutral-600">Case Number *</label>
            <input required value={form.case_number} onChange={(e) => setForm({ ...form, case_number: e.target.value })}
              placeholder="e.g. CC-2025-001"
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-neutral-600">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Case["status"] })}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
                <option value="open">Open</option><option value="active">Active</option><option value="closed">Closed</option>
              </select></div>
            <div><label className="text-xs font-medium text-neutral-600">Priority</label>
              <select value={form.case_priority} onChange={(e) => setForm({ ...form, case_priority: e.target.value as Case["case_priority"] })}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
                <option value="critical">Critical</option><option value="major">Major</option><option value="minor">Minor</option>
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-neutral-600">Prosecutor ID</label>
              <input type="number" value={form.prosecutor_id} onChange={(e) => setForm({ ...form, prosecutor_id: e.target.value })}
                placeholder="Personnel ID"
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
            <div><label className="text-xs font-medium text-neutral-600">Defense ID</label>
              <input type="number" value={form.defense_id} onChange={(e) => setForm({ ...form, defense_id: e.target.value })}
                placeholder="Personnel ID"
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-neutral-600">Court ID</label>
              <input type="number" value={form.court_id} onChange={(e) => setForm({ ...form, court_id: e.target.value })}
                placeholder="Court ID"
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
            <div><label className="text-xs font-medium text-neutral-600">Hearing Date</label>
              <input type="date" value={form.hearing_date} onChange={(e) => setForm({ ...form, hearing_date: e.target.value })}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-secondary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Creating…" : "Create Case"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
