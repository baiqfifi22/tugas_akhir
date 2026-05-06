import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { BarChart2, PieChart, Award, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEACHERS = [
  "Budi Santoso",
  "Siti Rahma",
  "Ahmad Dahlan",
  "Dewi Sartika",
  "Dian Sastro",
];

// Nilai rata-rata evaluasi guru per semester (skala 1–100)
const TEACHER_SCORES: Record<string, Record<string, number>> = {
  "Semester 1 2026": {
    "Budi Santoso": 88,
    "Siti Rahma": 92,
    "Ahmad Dahlan": 79,
    "Dewi Sartika": 85,
    "Dian Sastro": 95,
  },
  "Semester 2 2025": {
    "Budi Santoso": 84,
    "Siti Rahma": 88,
    "Ahmad Dahlan": 76,
    "Dewi Sartika": 81,
    "Dian Sastro": 90,
  },
};

// Poin-poin evaluasi sekolah: nama aspek → rata-rata skor keluhan (semakin tinggi = lebih banyak dikeluhkan)
const SCHOOL_EVAL_POINTS: Record<
  string,
  Record<string, number>
> = {
  "Semester 1 2026": {
    "Fasilitas Belajar": 42,
    "Kebersihan": 28,
    "Keamanan": 15,
    "Komunikasi Sekolah": 35,
    "Kegiatan Ekstra": 22,
    "Kurikulum": 18,
  },
  "Semester 2 2025": {
    "Fasilitas Belajar": 38,
    "Kebersihan": 32,
    "Keamanan": 18,
    "Komunikasi Sekolah": 40,
    "Kegiatan Ekstra": 25,
    "Kurikulum": 21,
  },
};

// Distribusi penilaian evaluasi guru (%)
const DISTRIBUTION: Record<
  string,
  { label: string; pct: number; color: string; bg: string }[]
> = {
  "Semester 1 2026": [
    { label: "Sangat Baik", pct: 35, color: "#10b981", bg: "bg-emerald-500" },
    { label: "Baik", pct: 40, color: "#3b82f6", bg: "bg-blue-500" },
    { label: "Cukup", pct: 18, color: "#f59e0b", bg: "bg-amber-500" },
    { label: "Kurang", pct: 7, color: "#ef4444", bg: "bg-red-500" },
  ],
  "Semester 2 2025": [
    { label: "Sangat Baik", pct: 30, color: "#10b981", bg: "bg-emerald-500" },
    { label: "Baik", pct: 42, color: "#3b82f6", bg: "bg-blue-500" },
    { label: "Cukup", pct: 20, color: "#f59e0b", bg: "bg-amber-500" },
    { label: "Kurang", pct: 8, color: "#ef4444", bg: "bg-red-500" },
  ],
};

const SEMESTERS = ["Semester 1 2026", "Semester 2 2025"];

const TEXT_COLORS: Record<string, string> = {
  "Budi Santoso": "text-blue-600",
  "Siti Rahma": "text-violet-600",
  "Ahmad Dahlan": "text-emerald-600",
  "Dewi Sartika": "text-amber-600",
  "Dian Sastro": "text-rose-600",
};
const BAR_COLORS: Record<string, string> = {
  "Budi Santoso": "bg-blue-500 hover:bg-blue-600",
  "Siti Rahma": "bg-violet-500 hover:bg-violet-600",
  "Ahmad Dahlan": "bg-emerald-500 hover:bg-emerald-600",
  "Dewi Sartika": "bg-amber-500 hover:bg-amber-600",
  "Dian Sastro": "bg-rose-500 hover:bg-rose-600",
};

// ─── Pie chart using conic-gradient ──────────────────────────────────────────
function PieChartViz({
  data,
}: {
  data: { label: string; pct: number; color: string; bg: string }[];
}) {
  let cumulative = 0;
  const segments = data.map((d) => {
    const start = cumulative;
    cumulative += d.pct;
    return { ...d, start, end: cumulative };
  });

  const gradient = segments
    .map((s) => `${s.color} ${s.start * 3.6}deg ${s.end * 3.6}deg`)
    .join(", ");

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8">
      {/* Pie */}
      <div
        className="w-44 h-44 rounded-full shrink-0 shadow-inner"
        style={{ background: `conic-gradient(${gradient})` }}
      />
      {/* Legend */}
      <div className="flex flex-col gap-3 w-full">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-3">
            <span className={`inline-block w-3 h-3 rounded-sm shrink-0 ${d.bg}`} />
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm text-zinc-700">{d.label}</span>
              <span className="text-sm font-bold text-zinc-900">{d.pct}%</span>
            </div>
            {/* mini progress bar */}
            <div className="w-24 h-2 bg-zinc-100 rounded-full overflow-hidden hidden sm:block">
              <div
                className={`h-full rounded-full ${d.bg}`}
                style={{ width: `${d.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function PrincipalEvaluationReports() {
  const [semester, setSemester] = useState("Semester 1 2026");

  const teacherScores = TEACHER_SCORES[semester] ?? {};
  const schoolPoints = SCHOOL_EVAL_POINTS[semester] ?? {};
  const distribution = DISTRIBUTION[semester] ?? [];

  // Summary
  const sortedTeachers = [...TEACHERS].sort(
    (a, b) => (teacherScores[b] ?? 0) - (teacherScores[a] ?? 0)
  );
  const highest = sortedTeachers[0];
  const lowest = sortedTeachers[sortedTeachers.length - 1];

  // School eval: sort by keluhan value
  const sortedSchool = Object.entries(schoolPoints).sort(
    ([, a], [, b]) => b - a
  );
  const maxSchool = sortedSchool[0]?.[1] ?? 1;

  const maxScore = Math.max(...Object.values(teacherScores));

  return (
    <Layout role="principal">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          Analisis Evaluasi Sekolah & Guru
        </h1>
        <p className="text-zinc-500">
          Ringkasan hasil evaluasi guru dan aspek sekolah per semester.
        </p>
      </div>

      {/* Filter semester */}
      <Card className="mb-8 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <span className="text-sm font-semibold text-zinc-700 shrink-0">
          Periode:
        </span>
        <div className="flex gap-2 flex-wrap">
          {SEMESTERS.map((s) => (
            <button
              key={s}
              onClick={() => setSemester(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                semester === s
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Charts Row 1 – Nilai Rata-rata Guru */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 size={18} className="text-blue-600" />
          <h2 className="text-base font-bold text-zinc-900">
            Nilai Rata-rata Evaluasi Guru
          </h2>
        </div>
        <div className="h-56 flex items-end gap-4 pb-6 relative">
          {/* Y axis */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-zinc-400 pb-6">
            {[100, 75, 50, 25].map((v) => (
              <span key={v}>{v}</span>
            ))}
          </div>
          <div className="flex-1 flex items-end gap-4 h-full pl-8">
            {TEACHERS.map((teacher) => {
              const score = teacherScores[teacher] ?? 0;
              const pct = (score / 100) * 100;
              return (
                <div
                  key={teacher}
                  className="flex-1 flex flex-col items-center gap-2 h-full"
                >
                  <span
                    className={`text-xs font-bold ${TEXT_COLORS[teacher] ?? "text-zinc-600"}`}
                  >
                    {score}
                  </span>
                  <div className="w-full bg-zinc-100 rounded-t-lg relative flex-1">
                    <div
                      className={`absolute bottom-0 w-full transition-all ${BAR_COLORS[teacher] ?? "bg-blue-500"} rounded-t-lg`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-zinc-500 font-medium text-center leading-tight">
                    {teacher.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {/* legend */}
        <div className="mt-4 flex flex-wrap gap-3 pt-4 border-t border-zinc-100">
          {TEACHERS.map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span
                className={`inline-block w-3 h-3 rounded-sm ${(BAR_COLORS[t] ?? "bg-blue-500").split(" ")[0]}`}
              />
              {t} — <span className="font-semibold">{teacherScores[t]}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Charts Row 2 – Evaluasi Sekolah per Aspek */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart2 size={18} className="text-rose-600" />
          <h2 className="text-base font-bold text-zinc-900">
            Aspek yang Paling Banyak Dikeluhkan
          </h2>
          <span className="text-xs text-zinc-400 ml-1">(skor keluhan)</span>
        </div>
        <div className="space-y-3">
          {sortedSchool.map(([aspect, score]) => (
            <div key={aspect}>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-zinc-700 font-medium">
                  {aspect}
                </span>
                <span className="text-sm font-bold text-rose-600">
                  {score} poin
                </span>
              </div>
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-400 rounded-full transition-all"
                  style={{ width: `${(score / maxSchool) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Pie Chart – Distribusi Penilaian */}
      <Card className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <PieChart size={18} className="text-violet-600" />
          <h2 className="text-base font-bold text-zinc-900">
            Distribusi Penilaian Guru
          </h2>
        </div>
        <PieChartViz data={distribution} />
      </Card>

      {/* Ringkasan */}
      <h2 className="text-lg font-bold text-zinc-900 mb-4">Ringkasan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Award size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500 font-medium">Nilai Tertinggi</p>
            <h3 className="text-xl font-bold text-zinc-900">{highest}</h3>
            <p className="text-sm text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp size={14} />
              Skor {teacherScores[highest]}
            </p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500 font-medium">Nilai Terendah</p>
            <h3 className="text-xl font-bold text-zinc-900">{lowest}</h3>
            <p className="text-sm text-red-500 font-semibold flex items-center gap-1">
              <TrendingDown size={14} />
              Skor {teacherScores[lowest]}
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
