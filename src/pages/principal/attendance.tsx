import React, { useState, useEffect, useCallback } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import {
  TrendingUp, TrendingDown, Award, AlertTriangle,
  BarChart2, Loader2, CheckCircle2, XCircle, Users,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["KEPALA_SEKOLAH"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface TahunAjaran { id: number; nama: string; status: string; }

interface KelasChart {
  kelasId: number; nama: string;
  hadir: number; tidakHadir: number; total: number;
  pctHadir: number; pctTidakHadir: number;
}

interface WaktuChart { label: string; month: string; pctHadir: number; hadir: number; total: number; }

interface TodayStatus { kelasId: number; nama: string; sudahAbsen: boolean; jumlahSesi: number; }

interface Summary {
  highest: { nama: string; pct: number } | null;
  lowest: { nama: string; pct: number } | null;
  mostAbsent: { nama: string; jumlah: number } | null;
  overallPct: number;
  totalHadir: number;
  totalSiswa: number;
}

interface ApiData {
  tahunList: TahunAjaran[];
  chartPerKelas: KelasChart[];
  chartPerWaktu: WaktuChart[];
  todayStatus: TodayStatus[];
  summary: Summary;
}

// ── Palet warna ───────────────────────────────────────────────────────────────

const BAR_COLORS = [
  "bg-blue-500", "bg-violet-500", "bg-emerald-500",
  "bg-amber-500", "bg-rose-500", "bg-cyan-500", "bg-orange-500",
];
const TEXT_COLORS = [
  "text-blue-600", "text-violet-600", "text-emerald-600",
  "text-amber-600", "text-rose-600", "text-cyan-600", "text-orange-600",
];

// ── Komponen: Double Bar (hadir vs tidak hadir) ───────────────────────────────

function DoubleBarChart({ items }: { items: KelasChart[] }) {
  if (items.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-zinc-400">
        Belum ada data absensi
      </div>
    );
  }

  const maxTotal = Math.max(...items.map((k) => k.total), 1);

  return (
    <div className="space-y-3">
      {items.map((k, i) => {
        const barColor = BAR_COLORS[i % BAR_COLORS.length];
        const txtColor = TEXT_COLORS[i % TEXT_COLORS.length];
        const hadirW = (k.hadir / maxTotal) * 100;
        const tidakW = (k.tidakHadir / maxTotal) * 100;

        return (
          <div key={k.kelasId}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-sm font-semibold ${txtColor}`}>Kelas {k.nama}</span>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${barColor}`} />
                  Hadir: <strong className={txtColor}>{k.pctHadir}%</strong>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-300" />
                  Absen: <strong className="text-red-500">{k.pctTidakHadir}%</strong>
                </span>
              </div>
            </div>
            {/* Bar hadir */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-zinc-400 w-10 text-right shrink-0">Hadir</span>
              <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-500`}
                  style={{ width: `${hadirW}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 w-8">{k.hadir}</span>
            </div>
            {/* Bar tidak hadir */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-10 text-right shrink-0">Absen</span>
              <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-300 rounded-full transition-all duration-500"
                  style={{ width: `${tidakW}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 w-8">{k.tidakHadir}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Komponen: Bar Chart Per Bulan (vertikal) ──────────────────────────────────

function MonthBarChart({ items }: { items: WaktuChart[] }) {
  if (items.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-zinc-400">
        Belum ada data
      </div>
    );
  }

  return (
    <div className="h-52 flex items-end gap-2 pb-6 pt-2 relative">
      <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-zinc-400">
        {[100, 75, 50, 25].map((v) => <span key={v} className="leading-none">{v}%</span>)}
      </div>
      <div className="flex-1 flex items-end gap-2 h-full pl-7">
        {items.map((item) => (
          <div key={item.month} className="flex-1 flex flex-col items-center gap-1 h-full min-w-0">
            <span className="text-[10px] font-bold text-violet-600">{item.pctHadir}%</span>
            <div className="w-full flex-1 bg-zinc-100 rounded-t-md relative">
              <div
                className="absolute bottom-0 w-full bg-violet-500 rounded-t-md transition-all duration-500"
                style={{ height: `${item.pctHadir}%` }}
              />
            </div>
            <span className="text-[10px] text-zinc-500 font-medium truncate w-full text-center">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PrincipalAttendance() {
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [selectedTahunId, setSelectedTahunId] = useState<number | null>(null);
  const [data, setData] = useState<Omit<ApiData, "tahunList"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil list TahunAjaran saat mount
  useEffect(() => {
    fetch("/api/principal/attendance")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTahunList(d.tahunList);
          if (d.selectedTahunId) setSelectedTahunId(d.selectedTahunId);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch data saat filter berubah
  const fetchData = useCallback(() => {
    if (!selectedTahunId) return;
    setIsLoading(true);

    fetch(`/api/principal/attendance?tahunAjaranId=${selectedTahunId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setData(d);
          if (d.tahunList) setTahunList(d.tahunList);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [selectedTahunId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const sudahAbsen = (data?.todayStatus ?? []).filter((s) => s.sudahAbsen).length;
  const belumAbsen = (data?.todayStatus ?? []).filter((s) => !s.sudahAbsen).length;

  return (
    <Layout role="principal">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Analisis Kehadiran</h1>
        <p className="text-zinc-500 text-sm mt-1">
          Persentase kehadiran dan ketidakhadiran siswa per kelas dan per bulan.
        </p>
      </div>

      {/* Filter Periode — Dropdown */}
      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-sm font-semibold text-zinc-700 shrink-0">Filter Periode:</span>
          <select
            value={selectedTahunId ?? ""}
            onChange={(e) => setSelectedTahunId(Number(e.target.value))}
            className="border border-zinc-200 rounded-lg px-4 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white w-full sm:w-auto"
          >
            {tahunList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}{t.status === "Aktif" ? " ✓ (Aktif)" : ""}
              </option>
            ))}
          </select>
          {tahunList.find((t) => t.id === selectedTahunId)?.status === "Aktif" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Tahun Ajaran Aktif
            </span>
          )}
        </div>
      </Card>

      {/* Status Hari Ini */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-zinc-900">Status Absensi Hari Ini</h2>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {sudahAbsen} sudah absen
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
              {belumAbsen} belum absen
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-zinc-100 rounded-xl animate-pulse" />
              ))
            : (data?.todayStatus ?? []).map((s) => (
                <div
                  key={s.kelasId}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl border ${
                    s.sudahAbsen
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  {s.sudahAbsen
                    ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    : <XCircle size={16} className="text-red-400 shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-800 truncate">Kelas {s.nama}</p>
                    <p className={`text-[10px] font-medium ${s.sudahAbsen ? "text-emerald-600" : "text-red-500"}`}>
                      {s.sudahAbsen ? `${s.jumlahSesi} sesi` : "Belum"}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Kehadiran Per Kelas */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={18} className="text-blue-600" />
            <div>
              <h2 className="text-base font-bold text-zinc-900">Kehadiran per Kelas</h2>
              <p className="text-xs text-zinc-400">Selama periode yang dipilih</p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-blue-400" />
            </div>
          ) : (
            <DoubleBarChart items={data?.chartPerKelas ?? []} />
          )}
        </Card>

        {/* Kehadiran Per Bulan */}
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={18} className="text-violet-600" />
            <div>
              <h2 className="text-base font-bold text-zinc-900">Kehadiran per Bulan</h2>
              <p className="text-xs text-zinc-400">Rata-rata semua kelas</p>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="animate-spin text-violet-400" />
            </div>
          ) : (
            <MonthBarChart items={data?.chartPerWaktu ?? []} />
          )}
        </Card>
      </div>

      {/* Ringkasan */}
      <h2 className="text-lg font-bold text-zinc-900 mb-4">Ringkasan</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-zinc-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !data?.summary.highest ? (
        <Card className="text-center py-8 text-zinc-400 text-sm">
          Belum ada data kehadiran untuk periode ini.
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {/* Kehadiran Tertinggi */}
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Award size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Kehadiran Tertinggi</p>
              <h3 className="text-xl font-bold text-zinc-900">Kelas {data.summary.highest.nama}</h3>
              <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp size={14} />
                {data.summary.highest.pct}% hadir
              </p>
            </div>
          </Card>

          {/* Kehadiran Terendah */}
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
              <TrendingDown size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Kehadiran Terendah</p>
              <h3 className="text-xl font-bold text-zinc-900">
                Kelas {data.summary.lowest?.nama ?? "—"}
              </h3>
              <p className="text-sm text-red-500 font-semibold flex items-center gap-1">
                <TrendingDown size={14} />
                {data.summary.lowest?.pct ?? 0}% hadir
              </p>
            </div>
          </Card>

          {/* Rata-rata Keseluruhan */}
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Rata-rata Keseluruhan</p>
              <h3 className="text-2xl font-bold text-zinc-900">{data.summary.overallPct}%</h3>
              <p className="text-xs text-zinc-400">
                {data.summary.totalHadir.toLocaleString()} dari {data.summary.totalSiswa.toLocaleString()} presensi
              </p>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
