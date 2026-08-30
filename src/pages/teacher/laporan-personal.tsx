import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { ActionModal, type ModalState } from "@/components/ui/ActionModal";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Loader2,
  Phone,
  User,
  CalendarDays,
  Filter,
  AlertTriangle,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["GURU", "KEPALA_SEKOLAH"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

// ── Types ────────────────────────────────────────────────────────────────────

interface LaporanItem {
  id: number;
  judul: string;
  isi: string;
  tanggal: string;
  dikonfirmasi: boolean;
  tanggalKonfirm: string | null;
  orangTua: { id: number; nama: string; noHp: string };
  siswa: { nama: string; nis: string };
  tahunAjaran: string;
}

type FilterType = "semua" | "belum" | "sudah";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TeacherLaporanPersonal() {
  const [laporan, setLaporan] = useState<LaporanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("semua");
  const [modal, setModal] = useState<ModalState>({ type: "idle" });

  useEffect(() => {
    fetch("/api/teacher/laporan-personal")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setLaporan(d.laporan);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleKonfirmasi = async (id: number) => {
    setModal({ type: "loading", message: "Mengkonfirmasi laporan..." });

    try {
      const res = await fetch("/api/teacher/laporan-personal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ laporanId: id }),
      });

      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* ignore */ }

      if (!res.ok) {
        setModal({
          type: "error",
          title: "Konfirmasi Gagal",
          message: (data.message as string) || "Gagal mengkonfirmasi laporan",
        });
        return;
      }

      // Update state lokal
      const now = new Date().toISOString();
      setLaporan((prev) =>
        prev.map((l) =>
          l.id === id ? { ...l, dikonfirmasi: true, tanggalKonfirm: now } : l
        )
      );
      setModal({
        type: "success",
        title: "Konfirmasi Berhasil!",
        message: "Laporan telah ditandai sudah dihubungi via WhatsApp.",
      });
    } catch {
      setModal({
        type: "error",
        title: "Konfirmasi Gagal",
        message: "Tidak dapat menghubungi server. Silakan coba lagi.",
      });
    }
  };

  const filtered = laporan.filter((l) => {
    if (filter === "belum") return !l.dikonfirmasi;
    if (filter === "sudah") return l.dikonfirmasi;
    return true;
  });

  const belumCount = laporan.filter((l) => !l.dikonfirmasi).length;
  const sudahCount = laporan.filter((l) => l.dikonfirmasi).length;

  return (
    <Layout role="teacher">
      {/* Popup Modal */}
      <ActionModal state={modal} onClose={() => setModal({ type: "idle" })} />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
            <MessageSquare size={20} className="text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Laporan Personal</h1>
            <p className="text-zinc-500 text-sm">
              Pesan masukan dari orang tua siswa secara personal
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="text-center py-4">
          <p className="text-2xl font-bold text-zinc-900">{laporan.length}</p>
          <p className="text-xs text-zinc-500 mt-1">Total Laporan</p>
        </Card>
        <Card className="text-center py-4 border-t-4 border-t-red-400">
          <p className="text-2xl font-bold text-red-500">{belumCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Belum Dikonfirmasi</p>
        </Card>
        <Card className="text-center py-4 border-t-4 border-t-emerald-400">
          <p className="text-2xl font-bold text-emerald-600">{sudahCount}</p>
          <p className="text-xs text-zinc-500 mt-1">Sudah Dikonfirmasi</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 mr-1">
          <Filter size={14} />
          Filter:
        </span>
        {(
          [
            { key: "semua", label: "Semua" },
            { key: "belum", label: `Belum Dikonfirmasi${belumCount > 0 ? ` (${belumCount})` : ""}` },
            { key: "sudah", label: "Sudah Dikonfirmasi" },
          ] as { key: FilterType; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              filter === key
                ? key === "belum"
                  ? "bg-red-500 text-white shadow-sm"
                  : key === "sudah"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-zinc-800 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24 gap-2 text-zinc-400">
          <Loader2 size={26} className="animate-spin text-orange-500" />
          <span className="text-sm">Memuat laporan...</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <Card className="text-center py-16 border-t-4 border-t-orange-200">
          <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare size={28} className="text-orange-300" />
          </div>
          <p className="font-semibold text-zinc-700">
            {filter === "semua"
              ? "Belum ada laporan masuk"
              : filter === "belum"
              ? "Tidak ada laporan yang belum dikonfirmasi"
              : "Belum ada laporan yang sudah dikonfirmasi"}
          </p>
          <p className="text-sm text-zinc-400 mt-1">
            {filter === "semua"
              ? "Laporan dari orang tua akan muncul di sini."
              : "Coba ubah filter untuk melihat laporan lainnya."}
          </p>
        </Card>
      )}

      {/* List laporan */}
      {!loading && (
        <div className="space-y-4 pb-10">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className={`p-0 overflow-hidden border-l-4 ${
                item.dikonfirmasi ? "border-l-emerald-400" : "border-l-red-400"
              }`}
            >
              {/* Header kartu */}
              <div
                className={`px-5 py-3 border-b flex items-center justify-between gap-3 ${
                  item.dikonfirmasi
                    ? "bg-emerald-50 border-emerald-100"
                    : "bg-red-50 border-red-100"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      item.dikonfirmasi
                        ? "bg-emerald-100"
                        : "bg-red-100"
                    }`}
                  >
                    {item.dikonfirmasi ? (
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    ) : (
                      <Clock size={16} className="text-red-500" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {item.orangTua.nama}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Orang tua dari{" "}
                      <span className="font-semibold">{item.siswa.nama}</span>{" "}
                      · NIS {item.siswa.nis}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    item.dikonfirmasi
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {item.dikonfirmasi ? "Terkonfirmasi" : "Belum Dikonfirmasi"}
                </span>
              </div>

              {/* Body kartu */}
              <div className="px-5 py-4">
                {/* Judul + Isi laporan */}
                <div className="mb-4">
                  {item.judul && (
                    <p className="text-sm font-bold text-zinc-900 mb-2">{item.judul}</p>
                  )}
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">
                    Isi Laporan
                  </p>
                  <p className="text-sm text-zinc-800 leading-relaxed bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                    {item.isi}
                  </p>
                </div>

                {/* Info detail */}
                <div className="flex flex-wrap gap-4 text-xs text-zinc-500 mb-4">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    Dikirim: {formatDate(item.tanggal)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <User size={13} />
                    {item.tahunAjaran}
                  </span>
                  {item.orangTua.noHp && (
                    <a
                      href={`https://wa.me/${item.orangTua.noHp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                    >
                      <Phone size={13} />
                      {item.orangTua.noHp}
                    </a>
                  )}
                </div>

                {/* Status konfirmasi */}
                {item.dikonfirmasi && item.tanggalKonfirm && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
                    <CheckCircle2 size={13} />
                    Dikonfirmasi pada {formatDateShort(item.tanggalKonfirm)} — Orang tua sudah dihubungi via WhatsApp
                  </div>
                )}

                {/* Tombol konfirmasi */}
                {!item.dikonfirmasi && (
                  <button
                    onClick={() => handleKonfirmasi(item.id)}
                    disabled={modal.type === "loading"}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm disabled:opacity-60"
                  >
                    <CheckCircle2 size={15} />
                    Konfirmasi — Sudah Hubungi via WA
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
