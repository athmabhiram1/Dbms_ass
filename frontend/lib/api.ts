const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function mapCase(back: any): Case {
  return {
    id: back.case_id,
    case_number: back.case_number,
    case_priority: back.case_priority,
    title: back.title,
    description: back.description,
    status: back.status,
    prosecutor_id: back.prosecutor_id,
    defense_id: back.defense_id,
    court_id: back.court_id,
    hearing_date: back.hearing_date,
    opened_date: back.opened_date,
    closed_date: back.closed_date,
    evidence_count: back.evidence_count ? Number(back.evidence_count) : undefined,
    prosecutor: back.prosecutor_name ? { id: back.prosecutor_id, name: back.prosecutor_name, badge_number: "", department: "", unit: "", contact: "", role: "prosecutor", is_active: true } : undefined,
    defense: back.defense_name ? { id: back.defense_id, name: back.defense_name, badge_number: "", department: "", unit: "", contact: "", role: "defense_attorney", is_active: true } : undefined,
    court: back.court_name ? { id: back.court_id, name: back.court_name, address: "", contact: "" } : undefined,
  };
}

function mapEvidence(back: any): Evidence {
  return {
    id: back.evidence_item_id,
    asset_tag: back.asset_tag,
    description: back.description,
    case_id: back.case_id,
    evidence_type_id: back.evidence_type_id,
    collected_date: back.collected_date,
    crime_scene_location: back.crime_scene_location,
    current_status: back.current_status,
    disposal_date: back.disposal_date,
    collected_by: back.collected_by,
    case: back.case_number ? { id: back.case_id, case_number: back.case_number, case_priority: "major", status: "open", prosecutor_id: 0, defense_id: 0, court_id: 0, hearing_date: null, opened_date: "", closed_date: null } : undefined,
    evidence_type: back.type_name ? { id: back.evidence_type_id, name: back.type_name } : undefined,
  };
}

function mapAuditTransfer(back: any): CustodyTransfer {
  return {
    id: back.transfer_id || Math.random(),
    evidence_item_id: back.evidence_item_id || 0,
    from_personnel_id: 0,
    to_personnel_id: 0,
    transfer_timestamp: back.transfer_timestamp,
    storage_location_id: 0,
    transfer_type: back.transfer_type,
    notes: back.notes,
    from_personnel: back.from_officer_name ? { id: 0, name: back.from_officer_name, badge_number: back.from_officer_badge || "", department: "", unit: "", contact: "", role: "officer", is_active: true } : undefined,
    to_personnel: back.to_officer_name ? { id: 0, name: back.to_officer_name, badge_number: back.to_officer_badge || "", department: "", unit: "", contact: "", role: "officer", is_active: true } : undefined,
    storage_location: back.location_room ? { id: 0, room: back.location_room, locker: back.location_locker || "", access_level: "", climate_notes: null } : undefined,
  };
}

function mapTransfer(back: any): CustodyTransfer {
  return {
    id: back.transfer_id,
    evidence_item_id: back.evidence_item_id,
    from_personnel_id: back.from_personnel_id,
    to_personnel_id: back.to_personnel_id,
    transfer_timestamp: back.transfer_timestamp,
    storage_location_id: back.storage_location_id,
    transfer_type: back.transfer_type,
    notes: back.notes,
    from_personnel: back.from_name ? { id: back.from_personnel_id, name: back.from_name, badge_number: back.from_badge_number || "", department: "", unit: "", contact: "", role: "officer", is_active: true } : undefined,
    to_personnel: back.to_name ? { id: back.to_personnel_id, name: back.to_name, badge_number: back.to_badge_number || "", department: "", unit: "", contact: "", role: "officer", is_active: true } : undefined,
    storage_location: back.room ? { id: back.storage_location_id, room: back.room, locker: back.locker || "", access_level: "", climate_notes: null } : undefined,
  };
}

function mapLabTest(back: any): LabTest {
  return {
    id: back.lab_test_id,
    evidence_item_id: back.evidence_item_id,
    test_type: back.test_type,
    requested_by: back.requested_by,
    lab_technician: back.lab_technician,
    status: back.status,
    results_summary: back.results_summary,
    request_date: back.request_date,
    completion_date: back.completion_date,
    evidence_item: back.asset_tag ? { id: back.evidence_item_id, asset_tag: back.asset_tag, description: back.description || "", case_id: 0, evidence_type_id: 0, collected_date: "", crime_scene_location: "", current_status: "collected", disposal_date: null, collected_by: 0 } : undefined,
    requester: back.requested_by_name ? { id: back.requested_by, name: back.requested_by_name, badge_number: "", department: "", unit: "", contact: "", role: "officer", is_active: true } : undefined,
    technician: back.technician_name ? { id: back.lab_technician, name: back.technician_name, badge_number: "", department: "", unit: "", contact: "", role: "lab_technician", is_active: true } : undefined,
  };
}

function mapPersonnel(back: any): Personnel {
  return {
    id: back.personnel_id,
    name: back.name,
    badge_number: back.badge_number,
    department: back.department || "",
    unit: back.unit || "",
    contact: back.contact || "",
    role: back.role,
    is_active: back.is_active,
  };
}

function mapRequest(back: any): EvidenceRequest {
  return {
    id: back.evidence_request_id,
    evidence_item_id: back.evidence_item_id,
    requesting_attorney_id: back.requesting_attorney_id,
    status: back.status,
    request_date: back.request_date,
    decision_date: back.decision_date,
    approved_by_id: back.approved_by_id,
    denial_reason: back.denial_reason,
    evidence_item: back.asset_tag ? { id: back.evidence_item_id, asset_tag: back.asset_tag, description: "", case_id: 0, evidence_type_id: 0, collected_date: "", crime_scene_location: "", current_status: "collected", disposal_date: null, collected_by: 0 } : undefined,
    requesting_attorney: back.requesting_attorney_name ? { id: back.requesting_attorney_id, name: back.requesting_attorney_name, badge_number: "", department: "", unit: "", contact: "", role: "defense_attorney", is_active: true } : undefined,
    approved_by: back.approved_by_name ? { id: back.approved_by_id, name: back.approved_by_name, badge_number: "", department: "", unit: "", contact: "", role: "prosecutor", is_active: true } : undefined,
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  const body = await res.json();
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    if (!body.success) throw new Error(body.error || "Request failed");
    return body.data as T;
  }
  return body as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Case {
  id: number;
  case_number: string;
  case_priority: "critical" | "major" | "minor";
  title?: string;
  description?: string;
  status: "open" | "active" | "closed";
  prosecutor_id: number;
  defense_id: number;
  court_id: number;
  hearing_date: string | null;
  opened_date: string;
  closed_date: string | null;
  prosecutor?: Personnel;
  defense?: Personnel;
  court?: Court;
  evidence_count?: number;
}

export interface Evidence {
  id: number;
  asset_tag: string;
  description: string;
  case_id: number;
  evidence_type_id: number;
  collected_date: string;
  crime_scene_location: string;
  current_status: "collected" | "in_storage" | "in_transit" | "at_lab" | "in_court" | "disposed";
  disposal_date: string | null;
  collected_by: number;
  case?: Case;
  evidence_type?: EvidenceType;
  collector?: Personnel;
}

export interface CustodyTransfer {
  id: number;
  evidence_item_id: number;
  from_personnel_id: number | null;
  to_personnel_id: number;
  transfer_timestamp: string;
  storage_location_id: number | null;
  transfer_type: "collection" | "transport" | "lab_submission" | "lab_return" | "court_delivery" | "disposal" | "defense_viewing";
  notes: string | null;
  from_personnel?: Personnel;
  to_personnel?: Personnel;
  storage_location?: StorageLocation;
  evidence_item?: Evidence;
}

export interface LabTest {
  id: number;
  evidence_item_id: number;
  test_type: "dna" | "fingerprint" | "toxicology" | "ballistics" | "digital_forensics";
  requested_by: number;
  lab_technician: number | null;
  status: "requested" | "in_progress" | "completed";
  results_summary: string | null;
  request_date: string;
  completion_date: string | null;
  evidence_item?: Evidence;
  requester?: Personnel;
  technician?: Personnel;
}

export interface Personnel {
  id: number;
  name: string;
  badge_number: string;
  department: string;
  unit: string;
  contact: string;
  role: "officer" | "lab_technician" | "prosecutor" | "defense_attorney" | "court_clerk";
  is_active: boolean;
}

export interface Court {
  id: number;
  name: string;
  address: string;
  contact: string;
}

export interface EvidenceType {
  id: number;
  name: string;
}

export interface StorageLocation {
  id: number;
  room: string;
  locker: string;
  access_level: string;
  climate_notes: string | null;
}

export interface EvidenceRequest {
  id: number;
  evidence_item_id: number;
  requesting_attorney_id: number;
  status: "pending" | "approved" | "denied" | "fulfilled";
  request_date: string;
  decision_date: string | null;
  approved_by_id: number | null;
  denial_reason: string | null;
  evidence_item?: Evidence;
  requesting_attorney?: Personnel;
  approved_by?: Personnel;
}

export interface DisclosureLog {
  id: number;
  evidence_item_id: number;
  evidence_request_id: number;
  viewing_attorney_id: number;
  supervising_officer_id: number;
  view_date: string;
  view_type: "physical_inspection" | "certified_copy" | "digital_copy";
  evidence_item?: Evidence;
  viewing_attorney?: Personnel;
  supervising_officer?: Personnel;
}

export interface AISummary {
  id: number;
  case_id: number;
  summary_text: string;
  model_used: string;
  generated_at: string;
  prompt_version: string;
  case?: Case;
}

export interface DashboardStats {
  total_active_cases: number;
  pending_lab_tests: number;
  items_in_transit: number;
  disposal_alerts: number;
  recent_transfers: CustodyTransfer[];
  lab_turnaround: { test_type: string; avg_days: number; target_days: number }[];
  case_backlog_by_priority: { priority: string; count: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const [cases, transfers, labTests, backlog] = await Promise.all([
      request<any[]>("/api/cases").catch(() => []),
      request<any[]>("/api/custody/transfers").catch(() => []),
      request<any[]>("/api/lab/tests").catch(() => []),
      request<any[]>("/api/analytics/backlog").catch(() => []),
    ]);
    const openCases = cases.filter((c: any) => c.status === "open" || c.status === "active");
    const pendingTests = labTests.filter((t: any) => t.status === "requested" || t.status === "in_progress");
    const inTransit = cases.filter((c: any) => {
      const ev = c.evidence_items || [];
      return ev.length > 0;
    }).length;
    const recentTransfers = transfers.slice(0, 10).map(mapTransfer);
    const counts: Record<string, number> = {};
    backlog.forEach((b: any) => {
      const p = b.case_priority === "critical" ? "Critical" : b.case_priority === "major" ? "Major" : "Minor";
      counts[p] = (counts[p] || 0) + Number(b.case_count);
    });
    return {
      total_active_cases: openCases.length,
      pending_lab_tests: pendingTests.length,
      items_in_transit: inTransit,
      disposal_alerts: 0,
      recent_transfers: recentTransfers,
      lab_turnaround: [
        { test_type: "DNA", avg_days: 0, target_days: 14 },
        { test_type: "Fingerprint", avg_days: 0, target_days: 5 },
        { test_type: "Toxicology", avg_days: 0, target_days: 21 },
        { test_type: "Digital", avg_days: 0, target_days: 10 },
      ],
      case_backlog_by_priority: [
        { priority: "Critical", count: counts.Critical || 0 },
        { priority: "Major", count: counts.Major || 0 },
        { priority: "Minor", count: counts.Minor || 0 },
      ],
    };
  },
};

// ─── Cases ────────────────────────────────────────────────────────────────────

export const casesApi = {
  list: async (params?: { status?: string; priority?: string; search?: string }): Promise<PaginatedResponse<Case>> => {
    const data = await request<any[]>("/api/cases");
    let mapped = data.map(mapCase);
    if (params?.status) mapped = mapped.filter((c) => c.status === params.status);
    if (params?.priority) mapped = mapped.filter((c) => c.case_priority === params.priority);
    if (params?.search) {
      const q = params.search.toLowerCase();
      mapped = mapped.filter((c) => c.case_number?.toLowerCase().includes(q));
    }
    return { data: mapped, total: mapped.length, page: 1, limit: mapped.length };
  },
  get: async (id: number): Promise<Case> => {
    const data = await request<any>(`/api/cases/${id}`);
    return mapCase(data);
  },
  create: async (_data: Partial<Case>): Promise<Case> => {
    throw new Error("Create case not implemented on backend");
  },
  update: async (_id: number, _data: Partial<Case>): Promise<Case> => {
    throw new Error("Update case not implemented on backend");
  },
  delete: async (_id: number): Promise<void> => {
    throw new Error("Delete case not implemented on backend");
  },
  getEvidence: async (id: number): Promise<Evidence[]> => {
    const data = await request<any[]>(`/api/cases/${id}/evidence`);
    return data.map(mapEvidence);
  },
  close: async (id: number): Promise<any> => {
    return request<any>(`/api/cases/${id}/close`, { method: "PATCH" });
  },
};

// ─── Evidence ─────────────────────────────────────────────────────────────────

export const evidenceApi = {
  list: async (params?: { status?: string; type?: string; case_id?: number; search?: string }): Promise<PaginatedResponse<Evidence>> => {
    let data = await request<any[]>("/api/evidence");
    let mapped = data.map(mapEvidence);
    if (params?.status) mapped = mapped.filter((e) => e.current_status === params.status);
    if (params?.type) mapped = mapped.filter((e) => e.evidence_type?.name === params.type);
    if (params?.case_id) mapped = mapped.filter((e) => e.case_id === params.case_id);
    if (params?.search) {
      const q = params.search.toLowerCase();
      mapped = mapped.filter((e) => e.asset_tag?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
    }
    return { data: mapped, total: mapped.length, page: 1, limit: mapped.length };
  },
  get: async (_id: number): Promise<Evidence> => {
    throw new Error("Single evidence get not implemented");
  },
  create: async (data: Partial<Evidence>): Promise<Evidence> => {
    const body: any = {
      asset_tag: data.asset_tag,
      description: data.description,
      case_id: data.case_id,
      evidence_type_id: data.evidence_type_id,
      collected_date: data.collected_date,
      crime_scene_location: data.crime_scene_location || null,
      collected_by: data.collected_by,
    };
    const res = await request<any>("/api/evidence", { method: "POST", body: JSON.stringify(body) });
    return mapEvidence(res);
  },
  update: async (_id: number, _data: Partial<Evidence>): Promise<Evidence> => {
    throw new Error("Update evidence not implemented");
  },
  delete: async (_id: number): Promise<void> => {
    throw new Error("Delete evidence not implemented");
  },
  getAuditTrail: async (idOrTag: number | string): Promise<CustodyTransfer[]> => {
    const tag = typeof idOrTag === "string" ? idOrTag : `id-${idOrTag}`;
    const data = await request<any[]>(`/api/evidence/${tag}/audit`);
    return data.map(mapAuditTransfer);
  },
  transfer: async (_id: number, _data: Partial<CustodyTransfer>): Promise<CustodyTransfer> => {
    throw new Error("Transfer via evidence endpoint not implemented — use custodyApi");
  },
};

// ─── Lab Tests ────────────────────────────────────────────────────────────────

export const labApi = {
  list: async (params?: { status?: string }): Promise<PaginatedResponse<LabTest>> => {
    const data = await request<any[]>("/api/lab/tests");
    let mapped = data.map(mapLabTest);
    if (params?.status) mapped = mapped.filter((t) => t.status === params.status);
    return { data: mapped, total: mapped.length, page: 1, limit: mapped.length };
  },
  get: async (_id: number): Promise<LabTest> => {
    throw new Error("Single lab test get not implemented");
  },
  create: async (data: Partial<LabTest>): Promise<LabTest> => {
    const res = await request<any>("/api/lab/tests", {
      method: "POST",
      body: JSON.stringify({
        evidence_item_id: data.evidence_item_id,
        test_type: data.test_type,
        requested_by: data.requested_by,
      }),
    });
    return mapLabTest(res);
  },
  update: async (_id: number, _data: Partial<LabTest>): Promise<LabTest> => {
    throw new Error("Update lab test not implemented");
  },
  complete: async (id: number, results_summary: string): Promise<LabTest> => {
    return request<any>(`/api/lab/tests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "completed", results_summary }),
    });
  },
  turnaround: async (): Promise<{ test_type: string; avg_days: number }[]> => {
    const data = await request<any[]>("/api/analytics/lab-turnaround");
    return data.map((t: any) => ({ test_type: t.test_type, avg_days: Number(t.avg_days) }));
  },
};

// ─── Custody Transfers / Audit ────────────────────────────────────────────────

export const auditApi = {
  list: async (params?: { evidence_item_id?: number }): Promise<PaginatedResponse<CustodyTransfer>> => {
    const data = await request<any[]>("/api/custody/transfers");
    let mapped = data.map(mapTransfer);
    if (params?.evidence_item_id) mapped = mapped.filter((t) => t.evidence_item_id === params.evidence_item_id);
    return { data: mapped, total: mapped.length, page: 1, limit: mapped.length };
  },
  get: async (_id: number): Promise<CustodyTransfer> => {
    throw new Error("Single transfer get not implemented");
  },
  create: async (data: Partial<CustodyTransfer>): Promise<CustodyTransfer> => {
    const res = await request<any>("/api/custody/transfer", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return mapTransfer(res);
  },
  getByEvidence: async (evidenceId: number): Promise<CustodyTransfer[]> => {
    const data = await request<any[]>("/api/custody/transfers");
    return data.filter((t: any) => t.evidence_item_id === evidenceId).map(mapTransfer);
  },
};

// ─── Personnel ────────────────────────────────────────────────────────────────

export const personnelApi = {
  list: async (params?: { role?: string; search?: string }): Promise<PaginatedResponse<Personnel>> => {
    let data = await request<any[]>("/api/personnel");
    let mapped = data.map(mapPersonnel);
    if (params?.role) mapped = mapped.filter((p) => p.role === params.role);
    if (params?.search) {
      const q = params.search.toLowerCase();
      mapped = mapped.filter((p) => p.name?.toLowerCase().includes(q) || p.badge_number?.toLowerCase().includes(q));
    }
    return { data: mapped, total: mapped.length, page: 1, limit: mapped.length };
  },
  get: async (_id: number): Promise<Personnel> => {
    throw new Error("Single personnel get not implemented");
  },
  create: async (data: Partial<Personnel>): Promise<Personnel> => {
    const res = await request<any>("/api/personnel", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return mapPersonnel(res);
  },
  update: async (id: number, data: Partial<Personnel>): Promise<Personnel> => {
    const res = await request<any>(`/api/personnel/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    return mapPersonnel(res);
  },
  deactivate: async (id: number): Promise<Personnel> => {
    const res = await request<any>(`/api/personnel/${id}/deactivate`, { method: "POST" });
    return mapPersonnel(res);
  },
};

// ─── Defense Disclosure ───────────────────────────────────────────────────────

export const disclosureApi = {
  listRequests: async (params?: { status?: string; attorney_id?: number }): Promise<PaginatedResponse<EvidenceRequest>> => {
    let data = await request<any[]>("/api/disclosure/requests");
    let mapped = data.map(mapRequest);
    if (params?.status) mapped = mapped.filter((r) => r.status === params.status);
    if (params?.attorney_id) mapped = mapped.filter((r) => r.requesting_attorney_id === params.attorney_id);
    return { data: mapped, total: mapped.length, page: 1, limit: mapped.length };
  },
  getRequest: async (_id: number): Promise<EvidenceRequest> => {
    throw new Error("Single request get not implemented");
  },
  createRequest: async (data: Partial<EvidenceRequest>): Promise<EvidenceRequest> => {
    const res = await request<any>("/api/disclosure/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return mapRequest(res);
  },
  approve: async (_id: number, _approved_by_id: number): Promise<EvidenceRequest> => {
    throw new Error("Approve endpoint not implemented on backend");
  },
  deny: async (_id: number, _denial_reason: string): Promise<EvidenceRequest> => {
    throw new Error("Deny endpoint not implemented on backend");
  },
  listLogs: async (_params?: { attorney_id?: number }): Promise<PaginatedResponse<DisclosureLog>> => {
    return { data: [], total: 0, page: 1, limit: 20 };
  },
  createLog: async (_data: Partial<DisclosureLog>): Promise<DisclosureLog> => {
    const res = await request<any>("/api/disclosure/log", {
      method: "POST",
      body: JSON.stringify(_data),
    });
    return { id: res.disclosure_log_id || res.log_id, ..._data } as DisclosureLog;
  },
};

// ─── AI Summaries ─────────────────────────────────────────────────────────────

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  constraint: string | null;
  foreignTable: string | null;
  foreignColumn: string | null;
}

export interface DatabaseTable {
  name: string;
  rowCount: number;
  totalSize: string;
  tableSize: string;
  indexSize: string;
  columns: DatabaseColumn[];
}

export interface DatabaseEnum {
  name: string;
  values: string[];
}

export interface DatabaseTrigger {
  name: string;
  table: string;
  event: string;
  timing: string;
  action: string;
}

export interface DatabaseSchemaResponse {
  tables: DatabaseTable[];
  enums: DatabaseEnum[];
  triggers: DatabaseTrigger[];
  totalDbSize: string;
}

export interface StorageGridItem {
  id: number;
  asset_tag: string;
  description: string;
  current_status: string;
  collected_date: string;
}

export interface StorageGridLocation {
  storage_location_id: number;
  room: string;
  locker: string | null;
  refrigerator: string | null;
  vault: string | null;
  climate_notes: string | null;
  access_level: string;
  items: StorageGridItem[];
}

export const aiApi = {
  list: async (): Promise<PaginatedResponse<AISummary>> => {
    const data = await request<any[]>("/api/analytics/ai/summaries");
    const mapped = data.map((s: any) => ({
      id: s.summary_id,
      case_id: s.case_id,
      summary_text: s.summary_text,
      model_used: s.model_used,
      generated_at: s.generated_at,
      prompt_version: s.prompt_version || "v1",
      case: s.case_number ? { id: s.case_id, case_number: s.case_number, title: s.case_title } as any : undefined,
    }));
    return { data: mapped, total: mapped.length, page: 1, limit: mapped.length };
  },
  get: async (_id: number): Promise<AISummary> => {
    throw new Error("Single AI summary get not implemented");
  },
  generate: async (case_id: string | number, provider?: string): Promise<AISummary> => {
    const res = await request<any>(`/api/analytics/ai/summarise/${case_id}`, {
      method: "POST",
      body: JSON.stringify({ provider: provider || "ollama" }),
    });
    return {
      id: res.summary_id || Date.now(),
      case_id: res.case_id,
      summary_text: res.summary_text,
      model_used: res.model_used,
      generated_at: res.generated_at,
      prompt_version: res.prompt_version || "v1",
    };
  },
};

// ─── Database Diagnostics ──────────────────────────────────────────────────────

export const databaseApi = {
  getSchema: async (): Promise<DatabaseSchemaResponse> => {
    return request<DatabaseSchemaResponse>("/api/database/schema");
  },
  getStorage: async (): Promise<StorageGridLocation[]> => {
    return request<StorageGridLocation[]>("/api/database/storage");
  },
};

// ─── Lookup Tables ────────────────────────────────────────────────────────────

export const lookupsApi = {
  evidenceTypes: async (): Promise<EvidenceType[]> => {
    const data = await request<any[]>("/api/evidence");
    const seen = new Set<number>();
    const types: EvidenceType[] = [];
    data.forEach((e: any) => {
      if (e.evidence_type_id && !seen.has(e.evidence_type_id)) {
        seen.add(e.evidence_type_id);
        types.push({ id: e.evidence_type_id, name: e.type_name || `Type ${e.evidence_type_id}` });
      }
    });
    return types;
  },
  storageLocations: async (): Promise<StorageLocation[]> => {
    const data = await request<any[]>("/api/custody/transfers");
    const seen = new Set<number>();
    const locs: StorageLocation[] = [];
    (data as any[]).forEach((t: any) => {
      if (t.storage_location_id && !seen.has(t.storage_location_id)) {
        seen.add(t.storage_location_id);
        locs.push({ id: t.storage_location_id, room: t.room || `Room ${t.storage_location_id}`, locker: t.locker || "", access_level: "restricted", climate_notes: null });
      }
    });
    return locs;
  },
  courts: async (): Promise<Court[]> => {
    const data = await request<any[]>("/api/cases");
    const seen = new Set<number>();
    const courts: Court[] = [];
    data.forEach((c: any) => {
      if (c.court_id && c.court_name && !seen.has(c.court_id)) {
        seen.add(c.court_id);
        courts.push({ id: c.court_id, name: c.court_name, address: "", contact: "" });
      }
    });
    return courts;
  },
};
