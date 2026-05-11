import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, Award, AlertTriangle, BarChart2 } from "lucide-react";

// ─── Dummy data dihapus, diubah menjadi state ──────────────────────────────────
interface ClassData {
  hadir: number;
  total: number;
}

type DataByPeriod = Record<string, Record<string, ClassData>>;

// semester 1 = jan–jun, semester 2 = jul–des
const SEMESTER_MAP: Record<string, string[]> = {
  "Semester 1 (Jan–Jun)": ["2026-01", "2026-02", "2026-03", "2026-04"],
};

const MONTH_LABEL: Record<string, string> = {
  "2026-01": "Jan",
  "2026-02": "Feb",
  "2026-03": "Mar",
  "2026-04": "Apr",
};

const getPct = (h: number, t: number) =>
  t > 0 ? Math.round((h / t) * 100) : 0;

const BAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];
const BAR_COLORS_HOVER = [
  "hover:bg-blue-600",
  "hover:bg-violet-600",
  "hover:bg-emerald-600",
  "hover:bg-amber-600",
  "hover:bg-rose-600",
];
const TEXT_COLORS = [
  "text-blue-600",
  "text-violet-600",
  "text-emerald-600",
  "text-amber-600",
  "text-rose-600",
];
const DOT_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
];

export default function PrincipalAttendanceAnalysis() {
  const [filterType, setFilterType] = useState<"bulan" | "semester">("bulan");
  const [selectedMonth, setSelectedMonth] = useState("2026-04");
  const [selectedSemester, setSelectedSemester] = useState("Semester 1 (Jan–Jun)");

  const [classes, setClasses] = useState<string[]>([]);
  const [dataByPeriod, setDataByPeriod] = useState<DataByPeriod>({});
  const [allMonths, setAllMonths] = useState<string[]>([]);

  React.useEffect(() => {
    // TODO: fetch attendance data (classes, dataByPeriod, and allMonths) dari database
  }, []);

  // ── Resolving active months ──────────────────────────────────────────────
  const activeMonths =
    filterType === "bulan"
      ? [selectedMonth]
      : SEMESTER_MAP[selectedSemester] ?? allMonths;

  // ── Grafik 1: per kelas (aggregated over active months) ─────────────────
  const classPct: Record<string, number> = {};
  classes.forEach((cls) => {
    let totalHadir = 0,
      totalSiswa = 0;
    activeMonths.forEach((m) => {
      const d = dataByPeriod[m]?.[cls];
      if (d) {
        totalHadir += d.hadir;
        totalSiswa += d.total;
      }
    });
    classPct[cls] = getPct(totalHadir, totalSiswa);
  });

  // ── Grafik 2: per waktu/bulan ────────────────────────────────────────────
  // average pct across all classes per month
  const monthlyAvg: { label: string; pct: number }[] = activeMonths.map(
    (m) => {
      const vals = classes.map((cls) => {
        const d = dataByPeriod[m]?.[cls];
        return d ? getPct(d.hadir, d.total) : 0;
      });
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      return { label: MONTH_LABEL[m] ?? m, pct: avg };
    }
  );

  // ── Summary ──────────────────────────────────────────────────────────────
  const sortedClasses = [...classes].sort(
    (a, b) => classPct[b] - classPct[a]
  );
  const highest = sortedClasses[0];
  const lowest = sortedClasses[sortedClasses.length - 1];

  return (
    <Layout role="principal">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Analisis Kehadiran</h1>
        <p className="text-zinc-500">
          Persentase kehadiran siswa per kelas dan per periode waktu.
        </p>
      </div>

      {/* Filter */}
      <Card className="mb-8 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <span className="text-sm font-semibold text-zinc-700 shrink-0">
          Filter Periode:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType("bulan")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === "bulan"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Bulanan
          </button>
          <button
            onClick={() => setFilterType("semester")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === "semester"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Semester
          </button>
        </div>
        {filterType === "bulan" ? (
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            {allMonths.map((m) => (
              <option key={m} value={m}>
                {MONTH_LABEL[m] || m} 2026
              </option>
            ))}
          </select>
        ) : (
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          >
            {Object.keys(SEMESTER_MAP).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        )}
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Grafik 1 – Per Kelas */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={18} className="text-blue-600" />
            <h2 className="text-base font-bold text-zinc-900">
              Kehadiran per Kelas
            </h2>
          </div>
          <div className="h-52 flex items-end gap-4 pb-6 relative">
            {/* Y axis labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-zinc-400 pb-6">
              {[100, 75, 50, 25].map((v) => (
                <span key={v}>{v}%</span>
              ))}
            </div>
            <div className="flex-1 flex items-end gap-3 h-full pl-8">
              {classes.length === 0 ? (
                <div className="w-full text-center text-sm text-zinc-400 self-center">Belum ada data</div>
              ) : classes.map((cls, idx) => {
                const pct = classPct[cls];
                return (
                  <div
                    key={cls}
                    className="flex-1 flex flex-col items-center gap-2 h-full"
                  >
                    <span
                      className={`text-xs font-bold ${TEXT_COLORS[idx % TEXT_COLORS.length]}`}
                    >
                      {pct}%
                    </span>
                    <div className="w-full bg-zinc-100 rounded-t-lg relative flex-1">
                      <div
                        className={`absolute bottom-0 w-full ${BAR_COLORS[idx % BAR_COLORS.length]} ${BAR_COLORS_HOVER[idx % BAR_COLORS_HOVER.length]} transition-colors rounded-t-lg`}
                        style={{ height: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">
                      {cls}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Grafik 2 – Per Waktu */}
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 size={18} className="text-violet-600" />
            <h2 className="text-base font-bold text-zinc-900">
              Kehadiran per Waktu (Rata-rata)
            </h2>
          </div>
          {monthlyAvg.length === 1 ? (
            <div className="h-52 flex flex-col items-center justify-center text-zinc-400 text-sm gap-2">
              <BarChart2 size={32} className="opacity-30" />
              <p>Pilih Semester untuk melihat perbandingan antar bulan.</p>
            </div>
          ) : (
            <div className="h-52 flex items-end gap-4 pb-6 relative">
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-zinc-400 pb-6">
                {[100, 75, 50, 25].map((v) => (
                  <span key={v}>{v}%</span>
                ))}
              </div>
              <div className="flex-1 flex items-end gap-3 h-full pl-8">
                {monthlyAvg.map((m, idx) => (
                  <div
                    key={m.label}
                    className="flex-1 flex flex-col items-center gap-2 h-full"
                  >
                    <span className="text-xs font-bold text-violet-600">
                      {m.pct}%
                    </span>
                    <div className="w-full bg-zinc-100 rounded-t-lg relative flex-1">
                      <div
                        className="absolute bottom-0 w-full bg-violet-500 hover:bg-violet-600 transition-colors rounded-t-lg"
                        style={{ height: `${m.pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Legenda kelas */}
      <Card className="mb-8 p-4">
        <div className="flex flex-wrap gap-4">
          {classes.length === 0 ? (
            <span className="text-sm text-zinc-400">Belum ada kelas</span>
          ) : classes.map((cls, idx) => (
            <div key={cls} className="flex items-center gap-2 text-sm text-zinc-600">
              <span
                className={`inline-block w-3 h-3 rounded-sm ${DOT_COLORS[idx % DOT_COLORS.length]}`}
              />
              {cls} — <span className="font-semibold">{classPct[cls]}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Ringkasan */}
      <h2 className="text-lg font-bold text-zinc-900 mb-4">Ringkasan</h2>
      {classes.length === 0 ? (
        <Card className="text-center py-6 text-zinc-500">Belum ada ringkasan</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Award size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">
                Kehadiran Tertinggi
              </p>
              <h3 className="text-xl font-bold text-zinc-900">
                Kelas {highest}
              </h3>
              <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp size={14} />
                {classPct[highest] || 0}% kehadiran
              </p>
            </div>
          </Card>
          <Card className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-sm text-zinc-500 font-medium">
                Kehadiran Terendah
              </p>
              <h3 className="text-xl font-bold text-zinc-900">
                Kelas {lowest}
              </h3>
              <p className="text-sm text-red-500 font-semibold flex items-center gap-1">
                <TrendingDown size={14} />
                {classPct[lowest] || 0}% kehadiran
              </p>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  );
}
