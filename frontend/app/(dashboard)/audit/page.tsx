"use client";

import { useState } from "react";
import { evidenceApi, auditApi, type Evidence, type CustodyTransfer } from "@/lib/api";
import { Search } from "lucide-react";

const ACTION_ICONS: Record<string, string> = {
  collection:       "add_circle",
  transport:        "swap_horiz",
  lab_submission:   "science",
  lab_return:       "biotech",
  court_delivery:   "gavel",
  disposal:         "delete",
  defense_viewing:  "visibility",
  default:          "radio_button_unchecked",
};
const ACTION_COLORS: Record<string, string> = {
  collection:      "bg-sky-100 text-sky-600",
  transport:       "bg-blue-100 text-blue-600",
  lab_submission:  "bg-purple-100 text-purple-600",
  lab_return:      "bg-indigo-100 text-indigo-600",
  court_delivery:  "bg-orange-100 text-orange-600",
  disposal:        "bg-red-100 text-red-600",
  defense_viewing: "bg-teal-100 text-teal-600",
  default:         "bg-neutral-100 text-neutral-500",
};

export default function AuditPage() {
  const [query, setQuery]         = useState("");
  const [evidence, setEvidence]   = useState<Evidence | null>(null);
  const [transfers, setTransfers] = useState<CustodyTransfer[]>([]);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);
  const [notFound, setNotFound]   = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setNotFound(false);
    try {
      // Search evidence by asset tag via list endpoint
      const res = await evidenceApi.list({ search: query });
      const item = res.data.find((ev) => ev.asset_tag.toLowerCase() === query.toLowerCase()) ?? res.data[0];
      if (!item) { setNotFound(true); setEvidence(null); setTransfers([]); return; }
      setEvidence(item);
      const trail = await evidenceApi.getAuditTrail(item.asset_tag);
      setTransfers(Array.isArray(trail) ? trail : []);
    } catch {
      setNotFound(true);
      setEvidence(null);
      setTransfers([]);
    } finally {
      setLoading(false);
    }
  };

  const iconFor  = (t: string) => ACTION_ICONS[t]  ?? ACTION_ICONS.default;
  const colorFor = (t: string) => ACTION_COLORS[t] ?? ACTION_COLORS.default;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-800">Audit Trail</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Full chain-of-custody log. Search by asset tag — calls <code className="bg-neutral-100 px-1 rounded text-xs">/api/evidence/&#123;id&#125;/audit</code>
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter asset tag (e.g. EV-2025-001)"
            className="pl-10 pr-4 py-2.5 w-full text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary" />
        </div>
        <button type="submit" className="px-5 py-2.5 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          Search
        </button>
      </form>

      {loading && <div className="text-center text-neutral-400 text-sm py-12">Searching…</div>}

      {!loading && searched && notFound && (
        <div className="text-center text-neutral-400 text-sm py-12 bg-white rounded-xl border border-neutral-100">
          No records found for <span className="font-mono font-medium text-neutral-600">{query}</span>
          <p className="text-xs mt-2 text-neutral-300">Make sure your backend returns evidence at <code>/api/evidence?search=&#123;tag&#125;</code></p>
        </div>
      )}

      {!loading && evidence && (
        <div className="bg-white rounded-xl border border-neutral-100 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-neutral-100">
            <div>
              <p className="text-xs text-neutral-400 uppercase tracking-wider">Asset Tag</p>
              <p className="font-mono font-bold text-secondary text-lg">{evidence.asset_tag}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{evidence.description}</p>
            </div>
            <div className="text-right">
              <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-1 rounded-full">{transfers.length} events</span>
              <p className="text-xs text-neutral-400 mt-1">Case {evidence.case?.case_number ?? `#${evidence.case_id}`}</p>
            </div>
          </div>

          {transfers.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No custody transfers recorded yet</p>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-px bg-neutral-200" />
              <div className="space-y-6">
                {transfers.map((t, i) => (
                  <div key={t.id} className="relative flex gap-4 pl-14">
                    <div className={`absolute left-1.5 w-7 h-7 rounded-full flex items-center justify-center ${colorFor(t.transfer_type)}`}>
                      <span className="material-symbols-outlined text-sm">{iconFor(t.transfer_type)}</span>
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-neutral-800 capitalize">{t.transfer_type.replace(/_/g, " ")}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            {t.from_personnel ? <><span className="font-medium">{t.from_personnel.name}</span> → </> : ""}
                            <span className="font-medium text-neutral-700">{t.to_personnel?.name ?? `ID: ${t.to_personnel_id}`}</span>
                            {t.storage_location && <> · {t.storage_location.room}/{t.storage_location.locker}</>}
                          </p>
                        </div>
                        <p className="text-xs text-neutral-400 whitespace-nowrap">{new Date(t.transfer_timestamp).toLocaleString()}</p>
                      </div>
                      {t.notes && (
                        <p className="text-xs text-neutral-500 mt-1.5 bg-neutral-50 rounded-lg px-3 py-2 border border-neutral-100">{t.notes}</p>
                      )}
                      {i < transfers.length - 1 && <div className="mt-4 border-t border-dashed border-neutral-100" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 text-neutral-400">
          <span className="material-symbols-outlined text-4xl block mb-2">manage_search</span>
          <p className="text-sm">Enter an asset tag to view its custody timeline</p>
        </div>
      )}
    </div>
  );
}
