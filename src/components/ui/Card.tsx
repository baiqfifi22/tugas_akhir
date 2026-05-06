import React, { ReactNode } from "react";

export function Card({ children, className = "", interactive = false }: { children: ReactNode, className?: string, interactive?: boolean }) {
  return (
    <div className={`bg-white p-6 rounded-xl border border-zinc-200 shadow-sm ${interactive ? 'hover:shadow-md transition-shadow' : ''} ${className}`}>
      {children}
    </div>
  );
}
