"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import Modal from "@/components/Modal";
import { disclosureApi, type EvidenceRequest, type DisclosureLog } from "@/lib/api";
import { Plus } from "lucide-react";

const STATUSES = ["", "pending", "approved", "denied", "fulfilled"];

export default function DisclosurePage() {
  const [requests, setRequests]   = useState<EvidenceRequest[]>([]);
  const [total, setTotal]         = useState(0);
  const [logs, setLogs]           = useState<DisclosureLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<EvidenceRequest | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatus] = useState("");
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    evidence_item_id: "", requesting_attorney_id: "", status: "pending" as EvidenceRequest["status"],
  });

  const load = () => {
    setLoading(true);
    disclosureApi.listRequests({ status: statusFilter || undefined })
      .then((d) => { setRequests(d.data); setTotal(d.total); })
      .catch(() => { setRequests([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleSelect = async (req: EvidenceRequest) => {
    setSelected(req);
    const logsRes = await disclosureApi.listLogs({ attorney_id: req.requesting_attorney_id }).catch(() => ({ data: [] }));
    setLogs(logsRes.data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await disclosureApi.createRequest({
      evidence_item_id:       Number(form.evidence_item_id),
      requesting_attorney_id: Number(form.requesting_attorney_id),
      status: form.status,
    }).catch(() => {});
    setSaving(false);
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Disclosure</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Brady/Giglio evidence requests · {total} total</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> New Request
        </button>
      </div>

      <div className="flex gap-3">
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
          <option value="">All Statuses</option>
          {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={load} className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-600">
          <span className="material-symbols-outlined text-[15px] align-middle">refresh</span>
        </button>
      </div>

      {/* Requests table */}
      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider bg-neutral-50 border-b border-neutral-100">
                <th className="px-5 py-3 text-left">ID</th>
                <th className="px-5 py-3 text-left">Evidence</th>
                <th className="px-5 py-3 text-left">Attorney</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Requested</th>
                <th className="px-5 py-3 text-left">Decision</th>
                <th className="px-5 py-3 text-left">Approved By</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-neutral-400 text-xs">Loading…</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <span className="material-symbols-outlined text-2xl block mx-auto mb-2 text-neutral-300">gavel</span>
                  <p className="text-xs text-neutral-400">No disclosure requests — backend: <code className="bg-neutral-100 px-1 rounded">/api/evidence-requests</code></p>
                </td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-neutral-50 hover:bg-neutral-50 cursor-pointer" onClick={() => handleSelect(req)}>
                    <td className="px-5 py-3 font-mono text-xs text-secondary">#{req.id}</td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-600">{req.evidence_item?.asset_tag ?? `#${req.evidence_item_id}`}</td>
                    <td className="px-5 py-3 text-neutral-700">{req.requesting_attorney?.name ?? `ID: ${req.requesting_attorney_id}`}</td>
                    <td className="px-5 py-3"><StatusBadge status={req.status} /></td>
                    <td className="px-5 py-3 text-neutral-500 text-xs">{new Date(req.request_date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-neutral-500 text-xs">{req.decision_date ? new Date(req.decision_date).toLocaleDateString() : "—"}</td>
                    <td className="px-5 py-3 text-neutral-500 text-xs">{req.approved_by?.name ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-neutral-200 z-40 flex flex-col">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-neutral-800">Request #{selected.id}</h2>
              <p className="text-xs text-neutral-400">{selected.evidence_item?.asset_tag ?? `Evidence #${selected.evidence_item_id}`}</p>
            </div>
            <button onClick={() => setSelected(null)}><span className="material-symbols-outlined text-xl text-neutral-400">close</span></button>
          </div>
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Status</p><StatusBadge status={selected.status} className="mt-1" /></div>
              {selected.decision_date && (
                <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Decision</p>
                  <p className="text-sm mt-1 text-neutral-700">{new Date(selected.decision_date).toLocaleDateString()}</p></div>
              )}
            </div>
            {selected.denial_reason && (
              <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Denial Reason</p>
                <p className="text-sm text-red-600 mt-1">{selected.denial_reason}</p></div>
            )}
            {selected.approved_by && (
              <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Approved By</p>
                <p className="text-sm text-neutral-700 mt-1">{selected.approved_by.name}</p></div>
            )}
            <div>
              <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3">Disclosure Logs</p>
              {logs.length === 0 ? (
                <p className="text-xs text-neutral-400">No viewing logs</p>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="text-sm border-l-2 border-neutral-200 pl-3">
                      <p className="font-medium text-neutral-700 capitalize">{log.view_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-neutral-400">{log.viewing_attorney?.name} · {new Date(log.view_date).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {selected.status === "pending" && (
            <div className="px-5 py-4 border-t border-neutral-100 flex gap-2">
              <button onClick={async () => { await disclosureApi.approve(selected.id, 1).catch(() => {}); setSelected(null); load(); }}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700">Approve</button>
              <button onClick={async () => {
                const reason = window.prompt("Denial reason:");
                if (!reason) return;
                await disclosureApi.deny(selected.id, reason).catch(() => {});
                setSelected(null); load();
              }} className="flex-1 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50">Deny</button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Disclosure Request" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div><label className="text-xs font-medium text-neutral-600">Evidence Item ID *</label>
            <input required type="number" value={form.evidence_item_id} onChange={(e) => setForm({ ...form, evidence_item_id: e.target.value })}
              placeholder="from /api/evidence"
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          <div><label className="text-xs font-medium text-neutral-600">Requesting Attorney ID *</label>
            <input required type="number" value={form.requesting_attorney_id} onChange={(e) => setForm({ ...form, requesting_attorney_id: e.target.value })}
              placeholder="from /api/personnel"
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          <div><label className="text-xs font-medium text-neutral-600">Initial Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as EvidenceRequest["status"] })}
              className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
              {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-secondary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Creating…" : "Create Request"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
