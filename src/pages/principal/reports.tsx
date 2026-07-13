import React, { useState, useEffect, useCallback } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import {
  BarChart2, Award, AlertTriangle, TrendingUp, TrendingDown,
  Loader2, PieChart,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["KEPALA_SEKOLAH"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface TahunAjaran { id: number; nama: string; status: string; }

interface GuruScore {
  id: number;
  nama: string;
  rata: number; // 1–5
  skor: number; // 0–100
}

interface AspekKeluhan {
  aspek: string;
  rata: number;
  keluhan: number;
}

interface Distribusi {
  label: string;
  count: number;
  pct: number;
}

interface ReportData {
  guruScores: GuruScore[];
  aspekDikeluhkan: AspekKeluhan[];
  distribusi: Distribusi[];
  summary: {
    highest: { nama: string; skor: number } | null;
    lowest: { nama: string; skor: number } | null;
  };
}

// ── Palet warna ───────────────────────────────────────────────────────────────

const BAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500",
];
const TEXT_COLORS = [
  "text-blue-600", "text-violet-600", "text-emerald-600",
  "text-amber-600", "text-rose-600", "text-cyan-600",
];

// Distribusi pie colors
const PIE_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];
const PIE_BG = ["bg-green-500", "bg-blue-500", "bg-amber-500", "bg-red-400"];

// ── Pie Chart (conic-gradient) ────────────────────────────────────────────────

function PieChartViz({ data }: { data: Distribusi[] }) {
  const filled = data.filter((d) => d.pct > 0);
  if (filled.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-zinc-400 text-sm">
        Belum ada data distribusi
      </div>
    );
  }

  // Hitung gradient tanpa mutasi variabel (hindari react-hooks/immutability)
  const gradientParts: string[] = [];
  filled.reduce((acc, d, i) => {
    const start = acc;
    const end = acc + d.pct;
    gradientParts.push(`${PIE_COLORS[i % PIE_COLORS.length]} ${start * 3.6}deg ${end * 3.6}deg`);
    return end;
  }, 0);
  const gradient = gradientParts.join(", ");

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      {/* Donut */}
      <div
        className="w-40 h-40 rounded-full shrink-0"
        style={{
          background: `conic-gradient(${gradient})`,
          WebkitMask: "radial-gradient(circle, transparent 45%, black 46%)",
          mask: "radial-gradient(circle, transparent 45%, black 46%)",
        }}
      />
      {/* Legend + mini bars */}
      <div className="flex-1 space-y-3 w-full">
        {data.map((d, i) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-sm shrink-0 ${PIE_BG[i % PIE_BG.length]}`} />
            <span className="text-sm text-zinc-700 w-24 shrink-0">{d.label}</span>
            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${PIE_BG[i % PIE_BG.length]}`}
                style={{ width: `${d.pct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-zinc-700 w-10 text-right">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PrincipalReports() {
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [selectedTahunId, setSelectedTahunId] = useState<number | null>(null);
  const [data, setData] = useState<ReportData | null>(null);
  const [noData, setNoData] = useState(false);
  const [noDataMsg, setNoDataMsg] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Ambil list TahunAjaran saat mount
  useEffect(() => {
    fetch("/api/principal/reports")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTahunList(d.tahunList);
          if (d.selectedTahunId) setSelectedTahunId(d.selectedTahunId);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  // Fetch data saat tahunAjaranId berubah
  const fetchData = useCallback(() => {
    if (!selectedTahunId) return;
    setIsLoading(true);
    setNoData(false);

    fetch(`/api/principal/reports?tahunAjaranId=${selectedTahunId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          if (d.tahunList) setTahunList(d.tahunList);
          if (d.noData) {
            setNoData(true);
            setNoDataMsg(d.message ?? "Belum ada data evaluasi");
            setData(null);
          } else {
            setData(d);
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedTahunId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Nilai tertinggi untuk normalisasi bar guru
  const maxSkor = Math.max(...(data?.guruScores.map((g) => g.skor) ?? [1]), 1);
  const maxKeluhan = Math.max(...(data?.aspekDikeluhkan.map((a) => a.keluhan) ?? [1]), 1);

  return (
    <Layout role="principal">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Analisis Evaluasi Sekolah &amp; Guru</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Ringkasan hasil evaluasi guru dan aspek sekolah per tahun ajaran.
        </p>
      </div>

      {/* Filter Tahun Ajaran */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm font-semibold text-zinc-700 shrink-0">Filter Periode:</span>
          {tahunList.length === 0 ? (
            <span className="text-sm text-zinc-400 py-1">Memuat...</span>
          ) : (
            <select
              value={selectedTahunId ?? ""}
              onChange={(e) => setSelectedTahunId(Number(e.target.value))}
              className="border border-zinc-200 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer w-full sm:w-auto sm:min-w-[280px]"
            >
              {tahunList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nama}{t.status === "Aktif" ? " (Aktif)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-24 gap-2 text-zinc-400">
          <Loader2 size={26} className="animate-spin text-blue-500" />
          <span className="text-sm">Memuat data evaluasi...</span>
        </div>
      )}

      {/* No Data */}
      {!isLoading && noData && (
        <Card className="text-center py-14 text-zinc-400">
          <BarChart2 size={36} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium text-zinc-500">{noDataMsg}</p>
          <p className="text-sm mt-1">Pastikan admin sudah membuka periode evaluasi untuk tahun ajaran ini.</p>
        </Card>
      )}

      {!isLoading && !noData && data && (
        <>
          {/* ── 1. Nilai Rata-rata Guru ──────────────────────────────────── */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={18} className="text-blue-600" />
              <h2 className="text-base font-bold text-zinc-900">Nilai Rata-rata Evaluasi Guru</h2>
              <span className="text-xs text-zinc-400 ml-1">(skala 0–100)</span>
            </div>

            {data.guruScores.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">Belum ada data evaluasi guru.</p>
            ) : (
              <>
                {/* Bar Chart */}
                <div className="h-56 flex items-end gap-2 pb-6 pt-2 relative">
                  <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-zinc-400">
                    {[100, 75, 50, 25].map((v) => (
                      <span key={v} className="leading-none">{v}</span>
                    ))}
                  </div>
                  <div className="flex-1 flex items-end gap-3 h-full pl-7">
                    {data.guruScores.map((g, i) => {
                      const barH = (g.skor / 100) * 100;
                      return (
                        <div key={g.id} className="flex-1 flex flex-col items-center gap-1 h-full min-w-0">
                          <span className={`text-[11px] font-bold ${TEXT_COLORS[i % TEXT_COLORS.length]}`}>
                            {g.skor}
                          </span>
                          <div className="w-full flex-1 bg-zinc-100 rounded-t-lg relative">
                            <div
                              className={`absolute bottom-0 w-full ${BAR_COLORS[i % BAR_COLORS.length]} rounded-t-lg transition-all duration-500`}
                              style={{ height: `${barH}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-500 font-medium truncate w-full text-center">
                            {g.nama.split(" ")[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legenda */}
                <div className="mt-2 pt-3 border-t border-zinc-100 flex flex-wrap gap-3">
                  {data.guruScores.map((g, i) => (
                    <div key={g.id} className="flex items-center gap-1.5 text-xs text-zinc-600">
                      <span className={`w-2.5 h-2.5 rounded-sm ${BAR_COLORS[i % BAR_COLORS.length]}`} />
                      {g.nama} —{" "}
                      <span className="font-semibold">{g.skor}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* ── 2. Aspek Paling Dikeluhkan ──────────────────────────────── */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 size={18} className="text-rose-500" />
              <h2 className="text-base font-bold text-zinc-900">Aspek yang Paling Banyak Dikeluhkan</h2>
            </div>

            {data.aspekDikeluhkan.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-8">Belum ada data evaluasi sekolah.</p>
            ) : (
              <div className="space-y-4">
                {data.aspekDikeluhkan.map((a) => (
                  <div key={a.aspek}>
                    <div className="flex items-start justify-between mb-1.5 gap-3">
                      <span className="text-sm text-zinc-700 font-medium leading-snug">
                        {a.aspek}
                      </span>
                      <span className="text-sm font-bold text-rose-500 shrink-0">
                        {a.keluhan} poin
                      </span>
                    </div>
                    <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-400 rounded-full transition-all duration-500"
                        style={{ width: `${(a.keluhan / maxKeluhan) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── 3. Distribusi Penilaian Guru ────────────────────────────── */}
          <Card className="mb-6">
            <div className="flex items-center gap-2 mb-5">
              <PieChart size={18} className="text-violet-600" />
              <h2 className="text-base font-bold text-zinc-900">Distribusi Penilaian Guru</h2>
            </div>
            <PieChartViz data={data.distribusi} />
          </Card>

          {/* ── Ringkasan ────────────────────────────────────────────────── */}
          <h2 className="text-lg font-bold text-zinc-900 mb-4">Ringkasan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-8">
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Award size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nilai Tertinggi</p>
                <h3 className="text-xl font-bold text-zinc-900">
                  {data.summary.highest?.nama ?? "—"}
                </h3>
                <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
                  <TrendingUp size={14} />
                  Skor {data.summary.highest?.skor ?? 0}
                </p>
              </div>
            </Card>
            <Card className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Nilai Terendah</p>
                <h3 className="text-xl font-bold text-zinc-900">
                  {data.summary.lowest?.nama ?? "—"}
                </h3>
                <p className="text-sm text-red-500 font-semibold flex items-center gap-1">
                  <TrendingDown size={14} />
                  Skor {data.summary.lowest?.skor ?? 0}
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}
