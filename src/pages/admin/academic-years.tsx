import React, { useState, useEffect, useCallback } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import {
  CalendarDays, Plus, CheckCircle2, XCircle, Loader2, AlertTriangle,
  BookOpen, Users, ClipboardCheck, LayoutList,
} from "lucide-react";


export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ADMIN"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface TahunAjaran {
  id: number; nama: string; status: string; mulai: string; selesai: string;
  stats: { sesiAbsensi: number; guruTahun: number; siswaKelas: number; periode: number; };
}
interface SetupStatus {
  tahunAjaranId: number; tahunAjaranNama: string;
  siswaSetup: number; totalSiswaAktif: number;
  guruSetup: number; totalGuruAktif: number;
  kelasList: { id: number; nama: string }[];
}
interface PreviewData { willPromote: number; willGraduate: number; alreadyEnrolled: number; tahunAktif: string; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const isAktif = status === "Aktif";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isAktif ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"}`}>
      {isAktif ? <CheckCircle2 size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-zinc-400" />}
      {status}
    </span>
  );
}

function ProgressBar({ value, max, color = "bg-blue-500" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Modal: Aktivasi ──────────────────────────────────────────────────────────
function ConfirmAktivasiModal({ target, currentActive, onConfirm, onCancel, loading }: {
  target: TahunAjaran; currentActive: TahunAjaran | null;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">Konfirmasi Aktivasi</h3>
            <p className="text-sm text-zinc-500 mt-1">Aktifkan <span className="font-semibold text-zinc-800">{target.nama}</span>?</p>
          </div>
        </div>
        {currentActive && currentActive.id !== target.id && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5 text-sm text-amber-800">
            <span className="font-semibold">{currentActive.nama}</span> yang sedang aktif akan otomatis dinonaktifkan.
          </div>
        )}
        <div className="bg-zinc-50 rounded-lg p-3 mb-5 text-sm text-zinc-600">
          Semua fitur absensi, penugasan guru, dan penempatan kelas akan berjalan di bawah tahun ajaran ini.
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">Batal</button>
          <button onClick={onConfirm} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Ya, Aktifkan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Buat Tahun Ajaran ─────────────────────────────────────────────────
function CreateModal({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const currentYear = new Date().getFullYear();
  const [tahun, setTahun] = useState(String(currentYear));
  const [semester, setSemester] = useState<"Ganjil" | "Genap">("Ganjil");
  const [mulai, setMulai] = useState("");
  const [selesai, setSelesai] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const namaPreview = tahun ? `${tahun}(${semester})` : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const res = await fetch("/api/admin/academic-years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: namaPreview, mulai, selesai }),
      });
      const data = await res.json();
      if (res.ok && data.success) { onSuccess(); onClose(); }
      else setError(data.message || "Gagal membuat tahun ajaran.");
    } catch { setError("Terjadi kesalahan pada server."); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <CalendarDays size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">Buat Tahun Ajaran Baru</h3>
            <p className="text-xs text-zinc-400">Status awal otomatis Nonaktif</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Tahun</label>
              <input type="number" value={tahun} onChange={(e) => setTahun(e.target.value)} min={2000} max={2100} required
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-zinc-700" placeholder="2026" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1">Semester</label>
              <select value={semester} onChange={(e) => setSemester(e.target.value as "Ganjil" | "Genap")}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-zinc-700 bg-white">
                <option value="Ganjil">Ganjil</option>
                <option value="Genap">Genap</option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-800">
            Nama: <span className="font-bold">{namaPreview || "—"}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Tanggal Mulai</label>
            <input type="date" value={mulai} onChange={(e) => setMulai(e.target.value)} required
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-zinc-700" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">Tanggal Selesai</label>
            <input type="date" value={selesai} onChange={(e) => setSelesai(e.target.value)} required min={mulai || undefined}
              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 text-zinc-700" />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Buat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}



// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AcademicYearsPage() {
  const [list, setList] = useState<TahunAjaran[]>([]);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<TahunAjaran | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const activeYear = list.find((t) => t.status === "Aktif") ?? null;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/academic-years");
      const data = await res.json();
      if (data.success) {
        setList(data.data);
        setSetupStatus(data.setupStatus ?? null);
      }
    } catch { showToast("Gagal memuat data.", "error"); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAktifkan = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/academic-years", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: confirmTarget.id, action: "aktifkan" }),
      });
      const data = await res.json();
      if (res.ok && data.success) { showToast(data.message, "success"); fetchData(); }
      else showToast(data.message || "Gagal mengaktifkan.", "error");
    } catch { showToast("Terjadi kesalahan.", "error"); }
    finally { setActionLoading(false); setConfirmTarget(null); }
  };

  const handleNonaktifkan = async (tahun: TahunAjaran) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/academic-years", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: tahun.id, action: "nonaktifkan" }),
      });
      const data = await res.json();
      if (res.ok && data.success) { showToast(data.message, "success"); fetchData(); }
      else showToast(data.message || "Gagal.", "error");
    } catch { showToast("Terjadi kesalahan.", "error"); }
    finally { setActionLoading(false); }
  };

  return (
    <Layout role="admin">
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Kelola Tahun Ajaran</h1>
          <p className="text-zinc-500 text-sm mt-1">Buat, aktifkan, dan setup tahun ajaran sekolah.</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Buat Tahun Ajaran
        </button>
      </div>

      {/* Banner tahun aktif */}
      {activeYear && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Aktif: <span className="text-emerald-700">{activeYear.nama}</span></p>
            <p className="text-xs text-emerald-600">{formatDate(activeYear.mulai)} — {formatDate(activeYear.selesai)}</p>
          </div>
        </div>
      )}

      {/* ── Panel Setup ── */}
      {setupStatus && (
        <Card className="mb-6 border-blue-200 bg-blue-50/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
              <ClipboardCheck size={15} className="text-blue-600" />
            </div>
            <h2 className="text-sm font-bold text-blue-900">Setup Tahun Ajaran: {setupStatus.tahunAjaranNama}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Siswa */}
            <div className="bg-white rounded-xl p-4 border border-zinc-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-600">Penempatan Siswa</span>
                </div>
                <span className="text-xs font-bold text-zinc-700">{setupStatus.siswaSetup} / {setupStatus.totalSiswaAktif}</span>
              </div>
              <ProgressBar value={setupStatus.siswaSetup} max={setupStatus.totalSiswaAktif} color="bg-blue-500" />
              {setupStatus.siswaSetup < setupStatus.totalSiswaAktif && (
                <p className="text-xs text-amber-600 mt-1.5">
                  {setupStatus.totalSiswaAktif - setupStatus.siswaSetup} siswa belum ditempatkan di TA ini
                </p>
              )}

            </div>

            {/* Guru */}
            <div className="bg-white rounded-xl p-4 border border-zinc-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen size={14} className="text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-600">Guru Ditugaskan</span>
                </div>
                <span className="text-xs font-bold text-zinc-700">
                  {setupStatus.guruSetup} / {setupStatus.totalGuruAktif} guru
                </span>
              </div>
              <ProgressBar
                value={setupStatus.guruSetup}
                max={setupStatus.totalGuruAktif}
                color="bg-violet-500"
              />
              {setupStatus.guruSetup < setupStatus.totalGuruAktif && (
                <p className="text-xs text-amber-600 mt-1.5">
                  {setupStatus.totalGuruAktif - setupStatus.guruSetup} guru belum ditugaskan di TA ini
                </p>
              )}

            </div>
          </div>
        </Card>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32 gap-3 text-zinc-400">
          <Loader2 size={28} className="animate-spin text-blue-500" />
          <span className="text-sm">Memuat data...</span>
        </div>
      ) : list.length === 0 ? (
        <Card>
          <div className="text-center py-16 text-zinc-400">
            <CalendarDays size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada tahun ajaran.</p>
            <button onClick={() => setShowCreate(true)} className="mt-4 text-sm text-blue-600 hover:underline font-medium">+ Buat Tahun Ajaran Pertama</button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {list.map((tahun) => {
            const isAktif = tahun.status === "Aktif";
            return (
              <Card key={tahun.id} className={`transition-all ${isAktif ? "border-emerald-300 ring-1 ring-emerald-200" : ""}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isAktif ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"}`}>
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold text-zinc-900">{tahun.nama}</h2>
                        <StatusBadge status={tahun.status} />
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">{formatDate(tahun.mulai)} — {formatDate(tahun.selesai)}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {[
                          { icon: ClipboardCheck, label: "sesi absensi", val: tahun.stats.sesiAbsensi },
                          { icon: Users, label: "siswa", val: tahun.stats.siswaKelas },
                          { icon: BookOpen, label: "penugasan guru", val: tahun.stats.guruTahun },
                          { icon: LayoutList, label: "periode evaluasi", val: tahun.stats.periode },
                        ].map(({ icon: Icon, label, val }) => (
                          <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-500">
                            <Icon size={12} className="text-zinc-400 shrink-0" />
                            <span className="font-semibold text-zinc-700">{val}</span>
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col sm:items-end shrink-0">
                    {isAktif ? (
                      <button onClick={() => handleNonaktifkan(tahun)} disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50">
                        {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />} Nonaktifkan
                      </button>
                    ) : (
                      <button onClick={() => setConfirmTarget(tahun)} disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 rounded-lg hover:bg-emerald-200 transition-colors disabled:opacity-50">
                        {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Aktifkan
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {confirmTarget && (
        <ConfirmAktivasiModal target={confirmTarget} currentActive={activeYear}
          onConfirm={handleAktifkan} onCancel={() => setConfirmTarget(null)} loading={actionLoading} />
      )}
      {showCreate && (
        <CreateModal onSuccess={fetchData} onClose={() => setShowCreate(false)} />
      )}


      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.msg}
        </div>
      )}
    </Layout>
  );
}
