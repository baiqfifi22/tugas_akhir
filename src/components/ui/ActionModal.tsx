import React from "react";
import { CheckCircle2, XCircle, Loader2, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ModalState =
  | { type: "idle" }
  | { type: "loading"; message?: string }
  | { type: "success"; title: string; message?: string }
  | { type: "error"; title?: string; message: string };

interface ActionModalProps {
  state: ModalState;
  onClose?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ActionModal({ state, onClose }: ActionModalProps) {
  if (state.type === "idle") return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
      onClick={state.type !== "loading" ? onClose : undefined}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading */}
        {state.type === "loading" && (
          <div className="flex flex-col items-center gap-4 px-8 py-10">
            <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-blue-500" />
            </div>
            <p className="font-semibold text-zinc-700 text-center">
              {state.message || "Memproses..."}
            </p>
          </div>
        )}

        {/* Success */}
        {state.type === "success" && (
          <>
            <div className="flex flex-col items-center gap-4 px-8 py-10">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                <CheckCircle2 size={36} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-zinc-900 text-lg">{state.title}</p>
                {state.message && (
                  <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">{state.message}</p>
                )}
              </div>
            </div>
            <div className="border-t border-zinc-100 px-6 pb-5 flex justify-center">
              <button
                onClick={onClose}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Tutup
              </button>
            </div>
          </>
        )}

        {/* Error */}
        {state.type === "error" && (
          <>
            <div className="flex flex-col items-center gap-4 px-8 py-10">
              <div className="w-16 h-16 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
                <XCircle size={36} className="text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-zinc-900 text-lg">
                  {state.title || "Gagal"}
                </p>
                <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">{state.message}</p>
              </div>
            </div>
            <div className="border-t border-zinc-100 px-6 pb-5 flex justify-center">
              <button
                onClick={onClose}
                className="flex-1 bg-red-500 hover:bg-red-600 active:scale-95 text-white py-2.5 rounded-xl font-bold text-sm transition-all"
              >
                Coba Lagi
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
