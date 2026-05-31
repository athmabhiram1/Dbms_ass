"use client";

import { useEffect, useState } from "react";
import { databaseApi, type DatabaseTable, type DatabaseSchemaResponse, type StorageGridLocation } from "@/lib/api";
import { 
  Database, 
  Cpu, 
  Layers, 
  Shield, 
  HardDrive, 
  RefreshCw, 
  Key, 
  Info,
  Calendar,
  Box,
  Thermometer,
  Grid,
  Lock,
  Server,
  WifiOff
} from "lucide-react";

// ============================================================================
// STUNNING STATIC FALLBACK DATA (If backend is unreachable)
// ============================================================================

const FALLBACK_SCHEMA: DatabaseSchemaResponse = {
  totalDbSize: "336 KB",
  tables: [
    {
      name: "cases",
      rowCount: 8,
      totalSize: "32 KB",
      tableSize: "16 KB",
      indexSize: "16 KB",
      columns: [
        { name: "case_id", type: "integer", nullable: false, defaultValue: "nextval('cases_case_id_seq')", constraint: "PRIMARY KEY", foreignTable: null, foreignColumn: null },
        { name: "case_number", type: "character varying(20)", nullable: false, defaultValue: null, constraint: "UNIQUE", foreignTable: null, foreignColumn: null },
        { name: "case_priority", type: "case_priority", nullable: false, defaultValue: "'major'", constraint: "CHECK", foreignTable: null, foreignColumn: null },
        { name: "title", type: "character varying(300)", nullable: false, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "status", type: "case_status", nullable: false, defaultValue: "'open'", constraint: null, foreignTable: null, foreignColumn: null },
        { name: "prosecutor_id", type: "integer", nullable: true, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "personnel", foreignColumn: "personnel_id" },
        { name: "defense_id", type: "integer", nullable: true, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "personnel", foreignColumn: "personnel_id" },
        { name: "court_id", type: "integer", nullable: true, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "courts", foreignColumn: "court_id" }
      ]
    },
    {
      name: "evidence_items",
      rowCount: 27,
      totalSize: "48 KB",
      tableSize: "16 KB",
      indexSize: "32 KB",
      columns: [
        { name: "evidence_item_id", type: "integer", nullable: false, defaultValue: "nextval('evidence_items_seq')", constraint: "PRIMARY KEY", foreignTable: null, foreignColumn: null },
        { name: "asset_tag", type: "character varying(50)", nullable: false, defaultValue: null, constraint: "UNIQUE", foreignTable: null, foreignColumn: null },
        { name: "description", type: "text", nullable: false, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "case_id", type: "integer", nullable: false, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "cases", foreignColumn: "case_id" },
        { name: "evidence_type_id", type: "integer", nullable: false, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "evidence_types", foreignColumn: "evidence_type_id" },
        { name: "collected_date", type: "timestamp with time zone", nullable: false, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "current_status", type: "evidence_status", nullable: false, defaultValue: "'collected'", constraint: null, foreignTable: null, foreignColumn: null },
        { name: "disposal_date", type: "date", nullable: true, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null }
      ]
    },
    {
      name: "custody_transfers",
      rowCount: 148,
      totalSize: "96 KB",
      tableSize: "32 KB",
      indexSize: "64 KB",
      columns: [
        { name: "transfer_id", type: "integer", nullable: false, defaultValue: "nextval('custody_transfers_seq')", constraint: "PRIMARY KEY", foreignTable: null, foreignColumn: null },
        { name: "evidence_item_id", type: "integer", nullable: false, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "evidence_items", foreignColumn: "evidence_item_id" },
        { name: "from_personnel_id", type: "integer", nullable: true, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "personnel", foreignColumn: "personnel_id" },
        { name: "to_personnel_id", type: "integer", nullable: false, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "personnel", foreignColumn: "personnel_id" },
        { name: "transfer_timestamp", type: "timestamp with time zone", nullable: false, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "storage_location_id", type: "integer", nullable: true, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "storage_locations", foreignColumn: "storage_location_id" },
        { name: "transfer_type", type: "transfer_type", nullable: false, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null }
      ]
    },
    {
      name: "storage_locations",
      rowCount: 10,
      totalSize: "16 KB",
      tableSize: "16 KB",
      indexSize: "0 Bytes",
      columns: [
        { name: "storage_location_id", type: "integer", nullable: false, defaultValue: "nextval('storage_locations_seq')", constraint: "PRIMARY KEY", foreignTable: null, foreignColumn: null },
        { name: "room", type: "character varying(100)", nullable: false, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "locker", type: "character varying(100)", nullable: true, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "refrigerator", type: "character varying(100)", nullable: true, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "vault", type: "character varying(100)", nullable: true, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "climate_notes", type: "text", nullable: true, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "access_level", type: "character varying(50)", nullable: false, defaultValue: "'restricted'", constraint: null, foreignTable: null, foreignColumn: null }
      ]
    },
    {
      name: "personnel",
      rowCount: 15,
      totalSize: "32 KB",
      tableSize: "16 KB",
      indexSize: "16 KB",
      columns: [
        { name: "personnel_id", type: "integer", nullable: false, defaultValue: "nextval('personnel_seq')", constraint: "PRIMARY KEY", foreignTable: null, foreignColumn: null },
        { name: "name", type: "character varying(200)", nullable: false, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "badge_number", type: "character varying(50)", nullable: false, defaultValue: null, constraint: "UNIQUE", foreignTable: null, foreignColumn: null },
        { name: "role", type: "personnel_role", nullable: false, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "is_active", type: "boolean", nullable: false, defaultValue: "true", constraint: null, foreignTable: null, foreignColumn: null }
      ]
    },
    {
      name: "lab_tests",
      rowCount: 12,
      totalSize: "16 KB",
      tableSize: "16 KB",
      indexSize: "0 Bytes",
      columns: [
        { name: "lab_test_id", type: "integer", nullable: false, defaultValue: "nextval('lab_tests_seq')", constraint: "PRIMARY KEY", foreignTable: null, foreignColumn: null },
        { name: "evidence_item_id", type: "integer", nullable: false, defaultValue: null, constraint: "FOREIGN KEY", foreignTable: "evidence_items", foreignColumn: "evidence_item_id" },
        { name: "test_type", type: "lab_test_type", nullable: false, defaultValue: null, constraint: null, foreignTable: null, foreignColumn: null },
        { name: "status", type: "lab_test_status", nullable: false, defaultValue: "'requested'", constraint: null, foreignTable: null, foreignColumn: null }
      ]
    }
  ],
  enums: [
    { name: "personnel_role", values: ["officer", "lab_technician", "prosecutor", "defense_attorney", "court_clerk"] },
    { name: "case_status", values: ["open", "active", "closed"] },
    { name: "case_priority", values: ["critical", "major", "minor"] },
    { name: "evidence_status", values: ["collected", "in_storage", "in_transit", "at_lab", "in_court", "disposed"] },
    { name: "transfer_type", values: ["collection", "transport", "lab_submission", "lab_return", "court_delivery", "disposal", "defense_viewing"] }
  ],
  triggers: [
    { name: "trg_auto_dispose_on_case_close", table: "cases", event: "UPDATE", timing: "BEFORE", action: "EXECUTE FUNCTION fn_auto_dispose_on_case_close()" },
    { name: "trg_validate_custody_sequence", table: "custody_transfers", event: "INSERT", timing: "BEFORE", action: "EXECUTE FUNCTION fn_validate_custody_sequence()" }
  ]
};

const FALLBACK_STORAGE: StorageGridLocation[] = [
  {
    storage_location_id: 1,
    room: "Room 101",
    locker: "Locker A1",
    refrigerator: null,
    vault: null,
    climate_notes: "Ambient temperature evidence locker",
    access_level: "restricted",
    items: [
      { id: 101, asset_tag: "EV-2026-001", description: "Colt .45 Semi-automatic handgun", current_status: "in_storage", collected_date: "2026-03-15T12:00:00Z" },
      { id: 102, asset_tag: "EV-2026-002", description: "Ammunition clip containing 6 rounds", current_status: "in_storage", collected_date: "2026-03-15T12:00:00Z" }
    ]
  },
  {
    storage_location_id: 2,
    room: "Room 102",
    locker: null,
    refrigerator: "Refrigerator B1",
    vault: null,
    climate_notes: "Biological evidence cold unit — 4°C",
    access_level: "restricted",
    items: [
      { id: 103, asset_tag: "EV-2026-003", description: "Blood specimen vial (Case 2026-CR-002)", current_status: "in_storage", collected_date: "2026-02-01T14:30:00Z" }
    ]
  },
  {
    storage_location_id: 3,
    room: "Room 103",
    locker: "Locker C1",
    refrigerator: null,
    vault: "Vault D1",
    climate_notes: "Secured high-value safe with continuous audit",
    access_level: "high",
    items: [
      { id: 104, asset_tag: "EV-2026-004", description: "Bundled recovered currency ($15,000 USD)", current_status: "in_storage", collected_date: "2026-02-15T09:15:00Z" }
    ]
  },
  {
    storage_location_id: 4,
    room: "Crime Lab DNA",
    locker: null,
    refrigerator: "Refrigerator B3",
    vault: null,
    climate_notes: "Dedicated DNA specimens — secure 4°C",
    access_level: "high",
    items: [
      { id: 105, asset_tag: "EV-2026-005", description: "Buccal swab specimen (Case 2026-CR-004)", current_status: "in_storage", collected_date: "2026-03-01T16:00:00Z" }
    ]
  }
];

// ============================================================================
// INSPECTOR PAGE COMPONENT
// ============================================================================

export default function DatabasePage() {
  const [schema, setSchema] = useState<DatabaseSchemaResponse>(FALLBACK_SCHEMA);
  const [storage, setStorage] = useState<StorageGridLocation[]>(FALLBACK_STORAGE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"schema" | "storage" | "triggers">("schema");
  const [selectedTable, setSelectedTable] = useState<string>("cases");
  const [offline, setOffline] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    try {
      const [schemaData, storageData] = await Promise.all([
        databaseApi.getSchema(),
        databaseApi.getStorage()
      ]);
      setSchema(schemaData);
      setStorage(storageData);
      setOffline(false);
      
      // Keep selected table if valid, otherwise select first
      if (schemaData.tables.length > 0) {
        const isValid = schemaData.tables.some(t => t.name === selectedTable);
        if (!isValid) setSelectedTable(schemaData.tables[0].name);
      }
    } catch (err) {
      console.warn("Backend connection offline — falling back to offline pre-loaded schema data.", err);
      setSchema(FALLBACK_SCHEMA);
      setStorage(FALLBACK_STORAGE);
      setOffline(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTableByName = (name: string): DatabaseTable | undefined => {
    return schema.tables.find(t => t.name === name);
  };

  const getConstraintBadgeColor = (constraint: string | null) => {
    if (!constraint) return "";
    const lower = constraint.toUpperCase();
    if (lower.includes("PRIMARY")) return "bg-amber-50 text-amber-800 border-amber-200/80";
    if (lower.includes("FOREIGN")) return "bg-blue-50 text-blue-800 border-blue-200/80";
    if (lower.includes("UNIQUE")) return "bg-teal-50 text-teal-800 border-teal-200/80";
    return "bg-slate-50 text-slate-700 border-slate-200/80";
  };

  const selectedTableData = getTableByName(selectedTable);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Database Inspector</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            Examine the physical relational structure, capacities, and trigger rules of CustodyCore
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {offline && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs font-semibold">
              <WifiOff size={14} className="stroke-[2.5]" />
              Showing Preloaded Data
            </div>
          )}
          <button 
            onClick={() => loadData(true)} 
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-1.5 border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low rounded-lg text-xs font-semibold transition-colors active:scale-95 duration-100 cursor-pointer"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Querying..." : "Sync Catalogs"}
          </button>
        </div>
      </div>

      {/* KPI Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600">
            <Server size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-surface">
              {loading ? <span className="inline-block w-12 h-6 bg-surface-container-low rounded animate-pulse" /> : (offline ? "Offline" : "Active")}
            </p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">PostgreSQL Service</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-50 text-purple-600">
            <HardDrive size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-surface">
              {loading ? <span className="inline-block w-12 h-6 bg-surface-container-low rounded animate-pulse" /> : schema.totalDbSize}
            </p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Total Schema Size</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-50 text-orange-600">
            <Database size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-surface">
              {loading ? <span className="inline-block w-12 h-6 bg-surface-container-low rounded animate-pulse" /> : schema.tables.length}
            </p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5 font-sans">Tables Registered</p>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 text-red-600">
            <Cpu size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-on-surface">
              {loading ? <span className="inline-block w-12 h-6 bg-surface-container-low rounded animate-pulse" /> : schema.triggers.length}
            </p>
            <p className="text-xs text-on-surface-variant font-medium mt-0.5">Compiled Triggers</p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex border-b border-outline-variant gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("schema")}
          className={`py-2 px-4 text-xs font-bold border-b-[3px] transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "schema"
              ? "border-secondary text-secondary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Database size={14} />
          Schema Explorer
        </button>
        <button
          onClick={() => setActiveTab("storage")}
          className={`py-2 px-4 text-xs font-bold border-b-[3px] transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "storage"
              ? "border-secondary text-secondary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Grid size={14} />
          Physical Storage Grid
        </button>
        <button
          onClick={() => setActiveTab("triggers")}
          className={`py-2 px-4 text-xs font-bold border-b-[3px] transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "triggers"
              ? "border-secondary text-secondary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <Cpu size={14} />
          Triggers & Enums
        </button>
      </div>

      {/* Tab Panels */}
      {loading ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-20 text-center text-xs text-on-surface-variant animate-pulse flex flex-col items-center justify-center gap-2">
          <RefreshCw size={20} className="animate-spin text-secondary" />
          Synchronising schema catalogs...
        </div>
      ) : (
        <>
          {activeTab === "schema" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
              {/* Tables Sidebar */}
              <div className="lg:col-span-1 border border-outline-variant bg-surface-container-lowest rounded-xl p-3 space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-2 mb-2">
                  System Tables (3NF)
                </p>
                {schema.tables.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTable(t.name)}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      selectedTable === t.name
                        ? "bg-surface-container-low text-secondary border-r-[3px] border-secondary"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">
                      {t.rowCount} rows
                    </span>
                  </button>
                ))}
              </div>

              {/* Table Column & Size Details */}
              <div className="lg:col-span-3 space-y-4">
                {selectedTableData ? (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 space-y-6">
                    {/* Table Title and Sizes */}
                    <div className="flex flex-wrap justify-between items-center border-b border-outline-variant pb-4 gap-4">
                      <div>
                        <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                          <Layers size={18} className="text-secondary" />
                          Table: <span className="font-mono text-secondary">{selectedTableData.name}</span>
                        </h2>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Structure defined in <code className="bg-surface-container-low px-1 py-0.5 rounded font-mono">01_schema.sql</code>
                        </p>
                      </div>
                      
                      <div className="flex gap-6 text-right">
                        <div>
                          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Estimated Rows</p>
                          <p className="text-sm font-bold text-on-surface mt-0.5">{selectedTableData.rowCount}</p>
                        </div>
                        <div className="border-l border-outline-variant h-8" />
                        <div>
                          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Indices size</p>
                          <p className="text-sm font-bold text-on-surface mt-0.5">{selectedTableData.indexSize}</p>
                        </div>
                        <div className="border-l border-outline-variant h-8" />
                        <div>
                          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Relation Size</p>
                          <p className="text-sm font-bold text-secondary mt-0.5">{selectedTableData.totalSize}</p>
                        </div>
                      </div>
                    </div>

                    {/* Columns Details Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant font-bold text-[10px] uppercase tracking-wider">
                            <th className="py-2.5 px-4 rounded-l-lg">Column Name</th>
                            <th className="py-2.5 px-4">DataType</th>
                            <th className="py-2.5 px-4 text-center">Nullable</th>
                            <th className="py-2.5 px-4">Constraint Rule</th>
                            <th className="py-2.5 px-4 rounded-r-lg">Default Expression</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/30">
                          {selectedTableData.columns.map((c) => (
                            <tr key={c.name} className="hover:bg-surface-container-low/30">
                              <td className="py-3 px-4 font-mono font-bold text-on-surface">{c.name}</td>
                              <td className="py-3 px-4 text-on-surface-variant">
                                <code className="bg-surface-container-low px-1.5 py-0.5 rounded text-[11px] font-mono border border-outline-variant/50 text-neutral-800">
                                  {c.type}
                                </code>
                              </td>
                              <td className="py-3 px-4 text-center text-on-surface-variant">
                                <span className={c.nullable ? "text-neutral-400" : "font-semibold text-neutral-800"}>
                                  {c.nullable ? "YES" : "NO"}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                {c.constraint && (
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 border rounded-full text-[10px] font-bold ${getConstraintBadgeColor(c.constraint)}`}>
                                    <Key size={9} className="stroke-[2.5]" />
                                    {c.constraint}
                                    {c.foreignTable && (
                                      <span className="font-normal opacity-85">
                                        {" "}→ {c.foreignTable}({c.foreignColumn})
                                      </span>
                                    )}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-neutral-400 font-mono text-[10px] max-w-[160px] truncate" title={c.defaultValue || ""}>
                                {c.defaultValue || "NULL"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-10 text-center text-on-surface-variant text-xs">
                    Select a table from the sidebar.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "storage" && (
            <div className="space-y-4">
              <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 flex gap-3 items-start">
                <Info size={16} className="text-secondary mt-0.5 flex-shrink-0" />
                <div className="text-xs text-on-surface-variant leading-relaxed">
                  <strong>Active storage maps:</strong> Mapped physically in <code>storage_locations</code>. Locker contents are updated based on the latest chronological audit entry in <code>custody_transfers</code> which marks an item as <code>in_storage</code>.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storage.map((loc) => {
                  const isHighSecurity = loc.access_level === "high" || !!loc.vault;
                  let typeLabel = "Locker";
                  let itemLabel = loc.locker || "General Shelf";
                  let styleClass = "border-outline-variant hover:border-outline";
                  let badgeClass = "bg-surface-container-low text-on-surface-variant border border-outline-variant";

                  if (loc.refrigerator) {
                    typeLabel = "Refrigerator";
                    itemLabel = loc.refrigerator;
                    styleClass = "border-blue-200 hover:border-blue-400 shadow-blue-50/50 shadow-sm";
                    badgeClass = "bg-blue-50 text-blue-800 border border-blue-200";
                  } else if (loc.vault) {
                    typeLabel = "Vault";
                    itemLabel = loc.vault;
                    styleClass = "border-amber-200 hover:border-amber-400 shadow-amber-50/50 shadow-sm";
                    badgeClass = "bg-amber-50 text-amber-800 border border-amber-200";
                  }

                  return (
                    <div key={loc.storage_location_id} className={`bg-surface-container-lowest border rounded-xl p-5 flex flex-col justify-between gap-5 transition-all ${styleClass}`}>
                      <div className="space-y-3">
                        {/* Storage Location Header */}
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest block font-mono">
                              {loc.room}
                            </span>
                            <h3 className="text-sm font-bold text-on-surface mt-1 flex items-center gap-1.5">
                              <Box size={14} className="text-secondary" />
                              {itemLabel}
                            </h3>
                          </div>
                          
                          <div className="flex gap-1 flex-shrink-0">
                            {isHighSecurity && (
                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-red-50 text-red-600 border border-red-200" title="High Security Zone">
                                <Lock size={11} className="stroke-[2.5]" />
                              </span>
                            )}
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${badgeClass}`}>
                              {typeLabel}
                            </span>
                          </div>
                        </div>

                        {/* Metadata details */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-on-surface-variant text-[10px]">
                            <Thermometer size={11} className="text-secondary" />
                            <span className="truncate">{loc.climate_notes || "Standard climate-controlled room"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-on-surface-variant text-[10px]">
                            <Shield size={11} className="text-secondary" />
                            <span>Access clearance: <strong className="capitalize text-on-surface">{loc.access_level}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Locker Items Inventory */}
                      <div className="border-t border-outline-variant/50 pt-3">
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2 tracking-wider">
                          Inventory ({loc.items.length} active)
                        </p>
                        
                        {loc.items.length === 0 ? (
                          <p className="text-[11px] text-neutral-400 italic py-3 text-center bg-surface-container-low/50 rounded-lg">
                            No items currently stored
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {loc.items.map((item) => (
                              <div key={item.id} className="flex flex-col p-2.5 bg-surface-container-low/40 hover:bg-surface-container-low/80 rounded-lg text-xs transition-colors border border-outline-variant/30">
                                <div className="flex justify-between items-center font-bold text-on-surface">
                                  <span className="text-[10px] text-secondary font-mono bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/50">
                                    {item.asset_tag}
                                  </span>
                                  <span className="text-[9px] font-normal text-on-surface-variant flex items-center gap-0.5">
                                    <Calendar size={8} />
                                    {new Date(item.collected_date).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-[10px] text-on-surface-variant mt-1.5 leading-relaxed">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "triggers" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Custom Database Enums */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Layers size={15} className="text-secondary" />
                    Custom Domain ENUM Types
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Custom data types enforcing constraint states inside PostgreSQL</p>
                </div>
                
                <div className="space-y-3">
                  {schema.enums.map((en) => (
                    <div key={en.name} className="p-3.5 bg-surface-container-low/30 border border-outline-variant/40 rounded-xl space-y-2">
                      <span className="text-[11px] font-bold font-mono text-secondary bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/60">
                        {en.name}
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {en.values.map((val) => (
                          <span key={val} className="text-[10px] font-semibold bg-indigo-50 text-indigo-800 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database Triggers */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Cpu size={15} className="text-secondary" />
                    Database Trigger Procedures
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">Automated procedures running inside database system transactions</p>
                </div>

                <div className="space-y-4">
                  {schema.triggers.map((trg) => (
                    <div key={trg.name} className="p-4 bg-surface-container-low/30 border border-outline-variant/40 rounded-xl space-y-3">
                      <div className="flex justify-between items-start gap-2 flex-wrap">
                        <div>
                          <h3 className="text-xs font-bold text-on-surface font-mono">{trg.name}</h3>
                          <p className="text-[10px] text-on-surface-variant mt-0.5">
                            Table: <span className="font-semibold font-mono text-secondary">{trg.table}</span>
                          </p>
                        </div>
                        <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded px-2.5 py-0.5 uppercase tracking-wider">
                          {trg.timing} {trg.event}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Action Statement</p>
                        <pre className="text-[10px] font-mono bg-surface-container-lowest p-2.5 rounded border border-outline-variant/60 text-on-surface overflow-x-auto whitespace-pre-wrap leading-normal">
                          {trg.action}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
