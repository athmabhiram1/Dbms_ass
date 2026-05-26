import React from "react";

type Status =
  | "active" | "closed" | "pending" | "open"
  | "collected" | "in_storage" | "in_transit" | "at_lab"
  | "in_lab" | "analyzed" | "in_court" | "released" | "disposed" | "destroyed"
  | "submitted" | "approved" | "rejected"
  | "requested" | "in_progress" | "fulfilled" | "denied"
  | string;

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  // Case statuses
  active:      { label: "Active",      className: "bg-green-100 text-green-700" },
  open:        { label: "Open",        className: "bg-blue-100 text-blue-700" },
  closed:      { label: "Closed",      className: "bg-neutral-100 text-neutral-500" },
  pending:     { label: "Pending",     className: "bg-yellow-100 text-yellow-700" },

  // Evidence lifecycle
  collected:   { label: "Collected",   className: "bg-sky-100 text-sky-700" },
  in_storage:  { label: "In Storage",  className: "bg-slate-100 text-slate-600" },
  in_transit:  { label: "In Transit",  className: "bg-orange-100 text-orange-700" },
  at_lab:      { label: "At Lab",      className: "bg-violet-100 text-violet-700" },
  in_lab:      { label: "In Lab",      className: "bg-purple-100 text-purple-700" },
  analyzed:    { label: "Analyzed",    className: "bg-emerald-100 text-emerald-700" },
  in_court:    { label: "In Court",    className: "bg-amber-100 text-amber-700" },
  released:    { label: "Released",    className: "bg-teal-100 text-teal-700" },
  disposed:    { label: "Disposed",    className: "bg-red-50 text-red-500" },
  destroyed:   { label: "Destroyed",   className: "bg-red-100 text-red-700" },

  // Submission / disclosure
  submitted:   { label: "Submitted",   className: "bg-indigo-100 text-indigo-700" },
  approved:    { label: "Approved",    className: "bg-green-100 text-green-700" },
  rejected:    { label: "Rejected",    className: "bg-red-100 text-red-700" },

  // Request / disclosure workflow
  requested:   { label: "Requested",   className: "bg-blue-100 text-blue-600" },
  in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-700" },
  fulfilled:   { label: "Fulfilled",   className: "bg-green-100 text-green-700" },
  denied:      { label: "Denied",      className: "bg-red-100 text-red-700" },
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const normalized = status?.toLowerCase().replace(/\s+/g, "_");
  const config = STATUS_MAP[normalized] ?? {
    label: status,
    className: "bg-neutral-100 text-neutral-600",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  );
}
