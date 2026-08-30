import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { ActionModal, type ModalState } from "@/components/ui/ActionModal";
import {
  MessageSquare,
  ChevronDown,
  Send,
  AlertTriangle,
  Loader2,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ORANG_TUA"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface GuruItem {
  id: number;
  nama: string;
}

// ── Fetch helper — selalu return JSON, tidak pernah throw untuk non-OK ────────

async function postLaporan(payload: {
  guruId: number;
  judul: string;
  isi: string;
}): Promise<{ ok: boolean; message?: string }> {
  let res: Response;
  try {
    res = await fetch("/api/parent/laporan-personal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, message: "Tidak dapat menghubungi server. Periksa koneksi internet Anda." };
  }

  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    return { ok: false, message: `Server error (${res.status}). Silakan coba lagi.` };
  }

  if (!res.ok) {
    return { ok: false, message: (data.message as string) || "Gagal mengirim laporan" };
  }
  return { ok: true };
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ParentLaporanPersonal() {
  const [guruList, setGuruList] = useState<GuruItem[]>([]);
  const [loadingGuru, setLoadingGuru] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedGuruId, setSelectedGuruId] = useState<number | "">("");
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ guru?: string; judul?: string; isi?: string }>({});

  const [modal, setModal] = useState<ModalState>({ type: "idle" });

  useEffect(() => {
    fetch("/api/parent/laporan-personal")
      .then(async (r) => {
        const d = await r.json();
        if (d.success) setGuruList(d.guruList);
        else setLoadError(d.message || "Gagal memuat daftar guru");
      })
      .catch(() => setLoadError("Tidak dapat menghubungi server"))
      .finally(() => setLoadingGuru(false));
  }, []);

  const validate = () => {
    const errs: typeof fieldErrors = {};
    if (!selectedGuruId) errs.guru = "Pilih guru terlebih dahulu";
    if (!judul.trim()) errs.judul = "Judul laporan wajib diisi";
    if (!isi.trim()) errs.isi = "Isi laporan wajib diisi";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setModal({ type: "loading", message: "Mengirim laporan..." });

    const result = await postLaporan({
      guruId: Number(selectedGuruId),
      judul: judul.trim(),
      isi: isi.trim(),
    });

    if (!result.ok) {
      setModal({
        type: "error",
        title: "Laporan Gagal Dikirim",
        message: result.message ?? "Terjadi kesalahan. Silakan coba lagi.",
      });
      return;
    }

    setModal({
      type: "success",
      title: "Laporan Berhasil Dikirim!",
      message:
        "Guru akan segera menerima laporan Anda dan menghubungi via WhatsApp setelah mengonfirmasi.",
    });

    // Reset form setelah sukses
    setSelectedGuruId("");
    setJudul("");
    setIsi("");
    setFieldErrors({});
  };

  return (
    <Layout role="parent">
      {/* Loading/Success/Error Popup */}
      <ActionModal
        state={modal}
        onClose={() => setModal({ type: "idle" })}
      />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-violet-100 flex items-center justify-center">
            <MessageSquare size={22} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Laporan Personal</h1>
            <p className="text-zinc-500 text-sm">
              Sampaikan pesan atau masukan personal kepada guru secara langsung
            </p>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-violet-50 border border-violet-100 rounded-2xl px-5 py-4 mb-6">
        <MessageSquare size={18} className="text-violet-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-violet-800 mb-0.5">Cara Kerja Laporan Personal</p>
          <p className="text-xs text-violet-600 leading-relaxed">
            Pilih guru yang ingin Anda hubungi, isi judul dan pesan laporan, lalu kirim.
            Guru akan menerima notifikasi dan mengonfirmasi bahwa sudah menghubungi Anda via WhatsApp.
            Laporan ini juga dapat dipantau oleh Kepala Sekolah.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-0 overflow-hidden border-t-4 border-t-violet-500 shadow-md">
        {/* Card Header */}
        <div className="px-7 py-5 bg-gradient-to-r from-violet-50 to-white border-b border-violet-100">
          <h2 className="text-base font-bold text-zinc-900">Form Laporan Personal</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Semua guru aktif tersedia — pilih sesuai kebutuhan Anda
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6">
          {/* ── Pilih Guru ─────────────────────────────────────────────── */}
          <div>
            <label htmlFor="select-guru" className="block text-sm font-semibold text-zinc-700 mb-1.5">
              Pilih Guru <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-zinc-400 mb-3">
              Pilih guru yang ingin Anda sampaikan laporan personal-nya
            </p>

            {loadingGuru ? (
              <div className="flex items-center gap-2 text-zinc-400 py-3">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Memuat daftar guru...</span>
              </div>
            ) : loadError ? (
              <div className="flex items-center gap-2 text-red-500 text-sm py-2">
                <AlertTriangle size={15} />
                {loadError}
              </div>
            ) : (
              <div className="relative">
                <select
                  id="select-guru"
                  value={selectedGuruId}
                  onChange={(e) => {
                    setSelectedGuruId(e.target.value === "" ? "" : Number(e.target.value));
                    setFieldErrors((prev) => ({ ...prev, guru: undefined }));
                  }}
                  className={`w-full appearance-none border rounded-xl px-4 py-3 pr-10 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-colors cursor-pointer bg-white ${
                    fieldErrors.guru
                      ? "border-red-300 bg-red-50/40"
                      : "border-zinc-200 hover:border-violet-300"
                  }`}
                >
                  <option value="">— Pilih Guru —</option>
                  {guruList.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nama}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
                />
              </div>
            )}

            {fieldErrors.guru && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} />
                {fieldErrors.guru}
              </p>
            )}
          </div>

          {/* ── Judul Laporan ──────────────────────────────────────────── */}
          <div>
            <label htmlFor="laporan-judul" className="block text-sm font-semibold text-zinc-700 mb-1.5">
              Judul Laporan <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-zinc-400 mb-3">
              Berikan judul singkat yang menggambarkan isi laporan Anda
            </p>
            <input
              id="laporan-judul"
              type="text"
              value={judul}
              onChange={(e) => {
                setJudul(e.target.value);
                setFieldErrors((prev) => ({ ...prev, judul: undefined }));
              }}
              placeholder="Contoh: Pertanyaan tentang perkembangan belajar anak"
              maxLength={150}
              className={`w-full border rounded-xl px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-colors ${
                fieldErrors.judul
                  ? "border-red-300 bg-red-50/40"
                  : "border-violet-200 bg-violet-50/40 focus:bg-white"
              }`}
            />
            <div className="flex items-center justify-between mt-1">
              {fieldErrors.judul ? (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {fieldErrors.judul}
                </p>
              ) : (
                <span />
              )}
              <span className="text-xs text-zinc-400 ml-auto">{judul.length}/150</span>
            </div>
          </div>

          {/* ── Isi Laporan ────────────────────────────────────────────── */}
          <div>
            <label htmlFor="laporan-isi" className="block text-sm font-semibold text-zinc-700 mb-1.5">
              Isi Laporan <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-zinc-400 mb-3">
              Sampaikan pesan, keluhan, atau pertanyaan Anda secara jelas dan lengkap
            </p>
            <textarea
              id="laporan-isi"
              rows={6}
              value={isi}
              onChange={(e) => {
                setIsi(e.target.value);
                setFieldErrors((prev) => ({ ...prev, isi: undefined }));
              }}
              placeholder="Tuliskan isi laporan Anda di sini..."
              className={`w-full border rounded-xl px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-colors resize-none ${
                fieldErrors.isi
                  ? "border-red-300 bg-red-50/40"
                  : "border-violet-200 bg-violet-50/40 focus:bg-white"
              }`}
            />
            {fieldErrors.isi && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertTriangle size={12} />
                {fieldErrors.isi}
              </p>
            )}
          </div>

          {/* ── Tombol Submit ──────────────────────────────────────────── */}
          <div className="flex justify-end pt-2 pb-1">
            <button
              type="submit"
              disabled={loadingGuru || modal.type === "loading"}
              className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-violet-200/60 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              Kirim Laporan
            </button>
          </div>
        </form>
      </Card>
    </Layout>
  );
}
