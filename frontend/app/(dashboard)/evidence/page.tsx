"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { evidenceApi, type Evidence } from "@/lib/api";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";

const STATUSES = ["", "collected", "in_storage", "in_transit", "at_lab", "in_court", "disposed"];
const TYPES    = ["", "dna", "fingerprint", "toxicology", "ballistics", "digital_forensics", "physical", "documentary"];

function EvidenceContent() {
  const searchParams = useSearchParams();
  const caseIdParam  = searchParams.get("case_id") ?? searchParams.get("caseId") ?? "";

  const [evidence, setEvidence]   = useState<Evidence[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [statusFilter, setStatus] = useState("");
  const [typeFilter, setType]     = useState("");

  const load = () => {
    setLoading(true);
    evidenceApi.list({
      status:  statusFilter || undefined,
      type:    typeFilter   || undefined,
      case_id: caseIdParam  ? Number(caseIdParam) : undefined,
    })
      .then((d) => { setEvidence(d.data); setTotal(d.total); })
      .catch(() => { setEvidence([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  const filtered = evidence.filter(
    (e) => e.asset_tag?.toLowerCase().includes(search.toLowerCase()) ||
           e.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Evidence Vault</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{total} items{caseIdParam && ` · filtered to case #${caseIdParam}`}</p>
        </div>
        <Link href="/evidence/new"
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Add Evidence
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tag or description…"
            className="pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary w-60" />
        </div>
        <Filter size={14} className="text-neutral-400" />
        <select value={statusFilter} onChange={(e) => setStatus(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
          <option value="">All Statuses</option>
          {STATUSES.slice(1).map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setType(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
          <option value="">All Types</option>
          {TYPES.slice(1).map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
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
                <th className="px-5 py-3 text-left">Asset Tag</th>
                <th className="px-5 py-3 text-left">Description</th>
                <th className="px-5 py-3 text-left">Type</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Case</th>
                <th className="px-5 py-3 text-left">Location</th>
                <th className="px-5 py-3 text-left">Collected</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-neutral-400 text-xs">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center">
                  <span className="material-symbols-outlined text-2xl block mx-auto mb-2 text-neutral-300">inventory_2</span>
                  <p className="text-xs text-neutral-400">No evidence found — backend endpoint: <code className="bg-neutral-100 px-1 rounded">/api/evidence</code></p>
                </td></tr>
              ) : (
                filtered.map((e) => (
                  <tr key={e.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-5 py-3 font-mono text-xs text-secondary font-semibold">{e.asset_tag}</td>
                    <td className="px-5 py-3 text-neutral-800 max-w-xs truncate">{e.description}</td>
                    <td className="px-5 py-3 text-xs text-neutral-500 capitalize">{e.evidence_type?.name ?? `#${e.evidence_type_id}`}</td>
                    <td className="px-5 py-3"><StatusBadge status={e.current_status} /></td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500">{e.case?.case_number ?? `#${e.case_id}`}</td>
                    <td className="px-5 py-3 text-xs text-neutral-500 truncate max-w-[120px]">{e.crime_scene_location}</td>
                    <td className="px-5 py-3 text-xs text-neutral-500">{new Date(e.collected_date).toLocaleDateString()}</td>
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

export default function EvidencePage() {
  return <Suspense fallback={<div className="p-6 text-neutral-400 text-sm">Loading…</div>}><EvidenceContent /></Suspense>;
}
