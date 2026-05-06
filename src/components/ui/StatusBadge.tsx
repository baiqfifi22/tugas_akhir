import React from "react";

export function StatusBadge({ status, label }: { status: "active" | "inactive" | "warning" | "danger" | "success", label?: string }) {
  let colorClass = "";
  if (status === "active" || status === "success") colorClass = "bg-green-100 text-green-800";
  else if (status === "inactive") colorClass = "bg-zinc-100 text-zinc-600";
  else if (status === "warning") colorClass = "bg-yellow-100 text-yellow-800";
  else if (status === "danger") colorClass = "bg-red-100 text-red-800";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label || status}
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-500">
      {message}
    </div>
  );
}
