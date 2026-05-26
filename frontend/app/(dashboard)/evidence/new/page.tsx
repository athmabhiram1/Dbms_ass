"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { evidenceApi, lookupsApi, casesApi, personnelApi, Evidence, Case, Personnel, EvidenceType } from "@/lib/api";

export default function NewEvidencePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    asset_tag: "",
    description: "",
    evidence_type_id: "",
    status: "collected",
    case_id: "",
    storage_location: "",
    collected_by: "",   // personnel id as string
    collected_at: new Date().toISOString().slice(0, 16),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Lookups
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);

  const STATUSES = [
    "collected", "in_storage", "in_transit", "at_lab", "analyzed",
    "in_court", "released", "disposed", "destroyed",
  ];

  useEffect(() => {
    Promise.allSettled([
      lookupsApi.evidenceTypes(),
      casesApi.list(),
      personnelApi.list(),
    ]).then(([typesResult, casesResult, personnelResult]) => {
      if (typesResult.status === "fulfilled") setEvidenceTypes(typesResult.value ?? []);
      if (casesResult.status === "fulfilled") setCases(casesResult.value?.data ?? []);
      if (personnelResult.status === "fulfilled") setPersonnel(personnelResult.value?.data ?? []);
    }).finally(() => setLoadingLookups(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await evidenceApi.create({
        asset_tag: form.asset_tag,
        description: form.description,
        evidence_type_id: form.evidence_type_id ? Number(form.evidence_type_id) : undefined,
        current_status: form.status as Evidence["current_status"],
        case_id: form.case_id ? Number(form.case_id) : undefined,
        crime_scene_location: form.storage_location || undefined,
        collected_by: form.collected_by ? Number(form.collected_by) : undefined,
        collected_date: form.collected_at,
      });
      router.push("/evidence");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create evidence");
      setSaving(false);
    }
  };

  const inputClass = "mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary";
  const selectClass = `${inputClass} bg-white`;
  const labelClass = "text-xs font-medium text-neutral-600";

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Add Evidence</h1>
          <p className="text-sm text-neutral-500">Create a new evidence record</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-100 p-6 space-y-5">

        {/* Asset Tag + Case */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Asset Tag *</label>
            <input
              type="text"
              required
              value={form.asset_tag}
              onChange={(e) => setForm({ ...form, asset_tag: e.target.value })}
              placeholder="e.g. EVD-2024-001"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Case</label>
            {loadingLookups ? (
              <div className={`${inputClass} text-neutral-400`}>Loading…</div>
            ) : cases.length > 0 ? (
              <select
                value={form.case_id}
                onChange={(e) => setForm({ ...form, case_id: e.target.value })}
                className={selectClass}
              >
                <option value="">— unlinked —</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.case_number} ({c.status})</option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="number"
                  value={form.case_id}
                  onChange={(e) => setForm({ ...form, case_id: e.target.value })}
                  placeholder="Case ID (backend: /api/cases)"
                  className={inputClass}
                />
                <p className="text-xs text-neutral-400 mt-1">Backend endpoint not available — enter ID manually</p>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Description *</label>
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Evidence Type</label>
            {loadingLookups ? (
              <div className={`${inputClass} text-neutral-400`}>Loading…</div>
            ) : evidenceTypes.length > 0 ? (
              <select
                value={form.evidence_type_id}
                onChange={(e) => setForm({ ...form, evidence_type_id: e.target.value })}
                className={selectClass}
              >
                <option value="">— select type —</option>
                {evidenceTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="number"
                  value={form.evidence_type_id}
                  onChange={(e) => setForm({ ...form, evidence_type_id: e.target.value })}
                  placeholder="Type ID (backend: /api/lookups/evidence-types)"
                  className={inputClass}
                />
                <p className="text-xs text-neutral-400 mt-1">Lookup not available</p>
              </>
            )}
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className={selectClass}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Location + Collected By */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Crime Scene / Collection Location</label>
            <input
              type="text"
              value={form.storage_location}
              onChange={(e) => setForm({ ...form, storage_location: e.target.value })}
              placeholder="e.g. 123 Main St, Room 4B"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Collected By *</label>
            {loadingLookups ? (
              <div className={`${inputClass} text-neutral-400`}>Loading…</div>
            ) : personnel.length > 0 ? (
              <select
                required
                value={form.collected_by}
                onChange={(e) => setForm({ ...form, collected_by: e.target.value })}
                className={selectClass}
              >
                <option value="">— select officer —</option>
                {personnel.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.badge_number} – {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  type="number"
                  required
                  value={form.collected_by}
                  onChange={(e) => setForm({ ...form, collected_by: e.target.value })}
                  placeholder="Personnel ID (backend: /api/personnel)"
                  className={inputClass}
                />
                <p className="text-xs text-neutral-400 mt-1">Lookup not available</p>
              </>
            )}
          </div>
        </div>

        {/* Collected At */}
        <div>
          <label className={labelClass}>Collection Date & Time *</label>
          <input
            type="datetime-local"
            required
            value={form.collected_at}
            onChange={(e) => setForm({ ...form, collected_at: e.target.value })}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-secondary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create Evidence"}
          </button>
        </div>
      </form>
    </div>
  );
}
