"use client";

import { useEffect, useState } from "react";
import Modal from "@/components/Modal";
import { personnelApi, type Personnel } from "@/lib/api";
import { Plus, Search } from "lucide-react";

const ROLES = ["officer", "lab_technician", "prosecutor", "defense_attorney", "court_clerk"] as const;
const DEPTS = ["Homicide", "Narcotics", "Cybercrime", "Forensics", "Administration", "Evidence Management"];

export default function PersonnelPage() {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [roleFilter, setRole]     = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Personnel | null>(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({
    name: "", badge_number: "", department: "Forensics",
    unit: "", contact: "", role: "officer" as Personnel["role"], is_active: true,
  });

  const load = () => {
    setLoading(true);
    personnelApi.list({ role: roleFilter || undefined, search: search || undefined })
      .then((d) => { setPersonnel(d.data); setTotal(d.total); })
      .catch(() => { setPersonnel([]); setTotal(0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [roleFilter]);

  const filtered = personnel.filter(
    (p) => p.name?.toLowerCase().includes(search.toLowerCase()) ||
           p.badge_number?.toLowerCase().includes(search.toLowerCase()) ||
           p.department?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", badge_number: "", department: "Forensics", unit: "", contact: "", role: "officer", is_active: true });
    setShowForm(true);
  };
  const openEdit = (p: Personnel) => {
    setEditing(p);
    setForm({ name: p.name, badge_number: p.badge_number, department: p.department, unit: p.unit, contact: p.contact, role: p.role, is_active: p.is_active });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await personnelApi.update(editing.id, form).catch(() => {});
    } else {
      await personnelApi.create(form).catch(() => {});
    }
    setSaving(false);
    setShowForm(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">Personnel</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{total} staff members</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={16} /> Add Personnel
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, badge…"
            className="pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-secondary w-full" />
        </div>
        <select value={roleFilter} onChange={(e) => setRole(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
        </select>
        <button onClick={load} className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 bg-white hover:bg-neutral-50 text-neutral-600">
          <span className="material-symbols-outlined text-[15px] align-middle">refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-neutral-400 uppercase tracking-wider bg-neutral-50 border-b border-neutral-100">
                <th className="px-5 py-3 text-left">Badge</th>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Department</th>
                <th className="px-5 py-3 text-left">Unit</th>
                <th className="px-5 py-3 text-left">Contact</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-neutral-400 text-xs">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center">
                  <span className="material-symbols-outlined text-2xl block mx-auto mb-2 text-neutral-300">badge</span>
                  <p className="text-xs text-neutral-400">No personnel — backend: <code className="bg-neutral-100 px-1 rounded">/api/personnel</code></p>
                </td></tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="border-b border-neutral-50 hover:bg-neutral-50">
                    <td className="px-5 py-3 font-mono text-xs text-secondary">{p.badge_number}</td>
                    <td className="px-5 py-3 font-medium text-neutral-800">{p.name}</td>
                    <td className="px-5 py-3 text-neutral-600 capitalize text-xs">{p.role.replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 text-neutral-600">{p.department}</td>
                    <td className="px-5 py-3 text-neutral-500">{p.unit}</td>
                    <td className="px-5 py-3 text-neutral-500 text-xs">{p.contact}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-500"}`}>
                        {p.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3 flex gap-2">
                      <button onClick={() => openEdit(p)} className="text-xs text-secondary hover:underline">Edit</button>
                      {p.is_active && (
                        <button onClick={async () => { await personnelApi.deactivate(p.id).catch(() => {}); load(); }}
                          className="text-xs text-red-500 hover:underline">Deactivate</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Edit Personnel" : "Add Personnel"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-neutral-600">Full Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
            <div><label className="text-xs font-medium text-neutral-600">Badge Number *</label>
              <input required value={form.badge_number} onChange={(e) => setForm({ ...form, badge_number: e.target.value })}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-neutral-600">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Personnel["role"] })}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
                {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-neutral-600">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-secondary">
                {DEPTS.map((d) => <option key={d}>{d}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-medium text-neutral-600">Unit</label>
              <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
            <div><label className="text-xs font-medium text-neutral-600">Contact</label>
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-secondary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Personnel"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
