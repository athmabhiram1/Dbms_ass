"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { labApi, type LabTest } from "@/lib/api";
import { Plus } from "lucide-react";

const TEST_TYPES = ["dna", "fingerprint", "toxicology", "ballistics", "digital_forensics"] as const;
const STATUSES   = ["", "requested", "in_progress", "completed"];

export default function LabPage() {
  const [tests, setTests]           = useState<LabTest[]>([]);
  const [total, setTotal]           = useState(0);
  const [turnaround, setTurnaround] = useState<{ test_type: string; avg_days: number }[]>([]);
  const [loading, setLoading]       = useState(true);
  const [statusFilter, setStatus]   = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected]     = useState<LabTest | null>(null);
  const [saving, setSaving]         = useState(false);
  const [form, setForm]             = useState({
    evidence_item_id: "", test_type: "dna" as LabTest["test_type"],
    requested_by: "", lab_technician: "",
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      labApi.list({ status: statusFilter || undefined }),
      labApi.turnaround(),
    ])
      .then(([d, t]) => { setTests(d.data); setTotal(d.total); setTurnaround(t); })
      .catch(() => { setTests([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await labApi.create({
      evidence_item_id: Number(form.evidence_item_id),
      test_type:        form.test_type,
      requested_by:     Number(form.requested_by),
      lab_technician:   form.lab_technician ? Number(form.lab_technician) : null,
    }).catch(() => {});
    setSaving(false);
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Lab Tests</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{total} total tests</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Request Test
        </button>
      </div>

      {/* Turnaround stats from API */}
      {turnaround.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {turnaround.map(({ test_type, avg_days }) => (
            <div key={test_type} className="bg-white rounded-xl border border-neutral-100 p-4">
              <p className="text-xs text-neutral-400 capitalize">{test_type.replace(/_/g, " ")}</p>
              <p className="text-xl font-bold text-neutral-800 mt-1">{avg_days.toFixed(1)} <span className="text-xs font-normal text-neutral-400">d avg</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
          <option value="">All Statuses</option>
          {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
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
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Test Type</th>
                <th className="px-5 py-3 text-left">Evidence</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Requested By</th>
                <th className="px-5 py-3 text-left">Technician</th>
                <th className="px-5 py-3 text-left">Requested</th>
                <th className="px-5 py-3 text-left">Completed</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-neutral-400 text-xs">Loading…</td></tr>
              ) : tests.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center">
                  <span className="material-symbols-outlined text-2xl block mx-auto mb-2 text-neutral-300">science</span>
                  <p className="text-xs text-neutral-400">No lab tests — backend: <code className="bg-neutral-100 px-1 rounded">/api/lab-tests</code></p>
                </td></tr>
              ) : (
                tests.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer" onClick={() => setSelected(t)}>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500">#{t.id}</td>
                    <td className="px-5 py-3 font-medium text-neutral-800 capitalize">{t.test_type.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 font-mono text-xs text-secondary">{t.evidence_item?.asset_tag ?? `#${t.evidence_item_id}`}</td>
                    <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-5 py-3 text-neutral-600">{t.requester?.name ?? `ID: ${t.requested_by}`}</td>
                    <td className="px-5 py-3 text-neutral-600">{t.technician?.name ?? (t.lab_technician ? `ID: ${t.lab_technician}` : "—")}</td>
                    <td className="px-5 py-3 text-neutral-500 text-xs">{new Date(t.request_date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-neutral-500 text-xs">{t.completion_date ? new Date(t.completion_date).toLocaleDateString() : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Results panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-neutral-200 z-40 flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800 capitalize">{selected.test_type.replace(/_/g, " ")} #{selected.id}</h2>
            <button onClick={() => setSelected(null)}><span className="material-symbols-outlined text-xl text-neutral-400">close</span></button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Status</p><StatusBadge status={selected.status} className="mt-1" /></div>
              <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Evidence</p>
                <p className="text-sm font-mono text-secondary mt-1">{selected.evidence_item?.asset_tag ?? `#${selected.evidence_item_id}`}</p></div>
            </div>
            <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Requester</p>
              <p className="text-sm text-neutral-700 mt-1">{selected.requester?.name ?? `ID: ${selected.requested_by}`}</p></div>
            {selected.results_summary && (
              <div><p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Results</p>
                <div className="bg-neutral-50 border border-neutral-100 rounded-lg p-3 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{selected.results_summary}</div></div>
            )}
          </div>
          {selected.status !== "completed" && (
            <div className="px-5 py-4 border-t border-neutral-100">
              <button
                onClick={async () => {
                  const summary = window.prompt("Enter results summary:");
                  if (!summary) return;
                  await labApi.complete(selected.id, summary).catch(() => {});
                  setSelected(null); load();
                }}
                className="w-full bg-secondary text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                Mark Complete & Enter Results
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Request Lab Test">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="text-xs font-medium text-neutral-600">Evidence Item ID *</label>
            <input required type="number" value={form.evidence_item_id} onChange={(e) => setForm({ ...form, evidence_item_id: e.target.value })}
              placeholder="Evidence item ID from /api/evidence"
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          <div><label className="text-xs font-medium text-neutral-600">Test Type</label>
            <select value={form.test_type} onChange={(e) => setForm({ ...form, test_type: e.target.value as LabTest["test_type"] })}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
              {TEST_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select></div>
          <div><label className="text-xs font-medium text-neutral-600">Requested By (Personnel ID) *</label>
            <input required type="number" value={form.requested_by} onChange={(e) => setForm({ ...form, requested_by: e.target.value })}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          <div><label className="text-xs font-medium text-neutral-600">Lab Technician ID (optional)</label>
            <input type="number" value={form.lab_technician} onChange={(e) => setForm({ ...form, lab_technician: e.target.value })}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-secondary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Requesting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
