import React from "react";

export function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-left text-sm">
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">{children}</thead>;
}

export function Th({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <th className={`px-6 py-4 ${className}`}>{children}</th>;
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-zinc-100">{children}</tbody>;
}

export function Tr({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <tr className={`hover:bg-zinc-50 transition-colors bg-white ${className}`}>{children}</tr>;
}

export function Td({ children, className = "", colSpan }: { children: React.ReactNode, className?: string, colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-6 py-4 ${className}`}>{children}</td>;
}

export function Checkbox({ checked, onChange, disabled }: { checked?: boolean; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled?: boolean }) {
  return <input type="checkbox" checked={checked} disabled={disabled} onChange={onChange} className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500" />;
}
