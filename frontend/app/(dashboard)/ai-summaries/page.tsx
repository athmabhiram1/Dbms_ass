"use client";

import { useEffect, useState } from "react";
import { aiApi, casesApi, type AISummary } from "@/lib/api";
import { Sparkles, RefreshCw } from "lucide-react";

export default function AISummariesPage() {
  const [summaries, setSummaries]   = useState<AISummary[]>([]);
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [caseId, setCaseId]         = useState("");
  const [provider, setProvider]     = useState("openai");
  const [selected, setSelected]     = useState<AISummary | null>(null);

  const load = () => {
    setLoading(true);
    aiApi.list()
      .then((d) => setSummaries(d.data))
      .catch(() => setSummaries([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId.trim()) return;
    setGenerating(true);
    try {
      const data = await aiApi.generate(Number(caseId), provider);
      setSummaries((prev) => [data, ...prev]);
      setSelected(data);
      setCaseId("");
    } catch {
      // backend unreachable — surface error gently
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">AI Summaries</h1>
          <p className="text-sm text-neutral-500 mt-0.5">AI-generated case intelligence briefings</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400" title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Generate form */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-800">Generate Case Summary</p>
            <p className="text-xs text-neutral-500 mt-0.5 mb-3">
              Calls <code className="bg-white/60 px-1 rounded">POST /api/ai-summaries/generate</code> with case_id and provider.
              Backend handles the AI model call.
            </p>
            <form onSubmit={handleGenerate} className="flex gap-3 flex-wrap">
              <input value={caseId} onChange={(e) => setCaseId(e.target.value)}
                placeholder="Case ID (e.g. 1)" type="text"
                className="flex-1 border border-blue-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary max-w-[120px]" />
              <select value={provider} onChange={(e) => setProvider(e.target.value)}
                className="border border-blue-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary">
                <option value="ollama">Ollama (Local)</option>
                <option value="openai">OpenAI GPT-4</option>
                <option value="claude">Anthropic Claude</option>
                <option value="template">Template (No LLM)</option>
              </select>
              <button type="submit" disabled={generating || !caseId}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {generating ? <><RefreshCw size={14} className="animate-spin" /> Generating…</> : <><Sparkles size={14} /> Generate</>}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* List */}
        <div className="lg:col-span-1 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-neutral-400 text-xs">Loading…</div>
          ) : summaries.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl border border-neutral-100">
              <span className="material-symbols-outlined text-2xl block mx-auto mb-2 text-neutral-300">auto_awesome</span>
              <p className="text-xs text-neutral-400">No summaries yet</p>
              <p className="text-xs text-neutral-300 mt-1">Backend: <code>/api/ai-summaries</code></p>
            </div>
          ) : (
            summaries.map((s) => (
              <button key={s.id} onClick={() => setSelected(s)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${selected?.id === s.id ? "border-secondary bg-blue-50" : "border-neutral-100 bg-white hover:bg-neutral-50"}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-neutral-800 truncate">
                    {s.case?.case_number ?? `Case #${s.case_id}`}
                  </p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 flex-shrink-0">{s.model_used}</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1.5 line-clamp-2">{s.summary_text?.slice(0, 100)}…</p>
                <p className="text-xs text-neutral-400 mt-2">{new Date(s.generated_at).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="bg-white rounded-xl border border-neutral-100 p-6">
              <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-neutral-100">
                <div>
                  <h2 className="text-base font-semibold text-neutral-800">
                    {selected.case?.case_number ?? `Case #${selected.case_id}`} — Intelligence Brief
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Generated {new Date(selected.generated_at).toLocaleString()} · {selected.model_used} · v{selected.prompt_version}
                  </p>
                </div>
              </div>
              <div className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{selected.summary_text}</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-neutral-100 h-full flex items-center justify-center py-20">
              <div className="text-center text-neutral-400">
                <Sparkles size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">Select a summary or generate one for a case</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
