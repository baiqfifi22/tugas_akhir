import React, { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "small-pill" | "icon-transparent";
  children: ReactNode;
};

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  let baseClass = "transition ";
  
  if (variant === "primary") {
    baseClass += "flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm";
  } else if (variant === "outline") {
    baseClass += "flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-50";
  } else if (variant === "small-pill") {
    baseClass += "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200";
  } else if (variant === "icon-transparent") {
    baseClass = "text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100";
  }

  return (
    <button className={`${baseClass} ${className}`} {...props}>
      {children}
    </button>
  );
}
