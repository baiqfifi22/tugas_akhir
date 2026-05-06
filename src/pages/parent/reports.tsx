import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { BarChart2, BookOpen, Calendar, ChevronDown } from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_MONTHLY = [
  { month: "Jan", hadir: 20, sakit: 1, izin: 0, alpa: 0 },
  { month: "Feb", hadir: 18, sakit: 2, izin: 1, alpa: 0 },
  { month: "Mar", hadir: 21, sakit: 0, izin: 1, alpa: 0 },
  { month: "Apr", hadir: 10, sakit: 1, izin: 0, alpa: 0 },
];

const MOCK_REPORTS = [
  {
    id: "r1",
    period: "Maret 2026",
    notes:
      "Deni menunjukkan perkembangan yang sangat baik dalam pelajaran Matematika. Aktif bertanya dan mulai membantu teman-temannya. Perlu terus didukung untuk meningkatkan kepercayaan diri.",
  },
  {
    id: "r2",
    period: "April 2026",
    notes:
      "Bulan ini Deni cukup aktif namun masih perlu bimbingan lebih dalam memahami materi. Kehadiran perlu ditingkatkan, ada beberapa hari tidak hadir tanpa keterangan.",
  },
  {
    id: "r3",
    period: "Februari 2026",
    notes:
      "Deni mulai menunjukkan minat pada pelajaran sains. Beberapa tugas belum dikumpulkan tepat waktu. Orang tua disarankan untuk lebih memantau jadwal belajar di rumah.",
  },
];

export default function ParentReports() {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);

  return (
    <Layout role="parent">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Laporan</h1>
        <p className="text-zinc-500">
          Ringkasan kehadiran dan perkembangan Deni Hidayat.
        </p>
      </div>

      {/* ── Bagian 1: Rekap Kehadiran ─────────────────────────────────────── */}
      <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <BarChart2 size={18} className="text-blue-600" />
        Statistik Kehadiran Bulanan
      </h2>
      <Card className="mb-4 h-56 flex items-end gap-6 p-6 pt-16 relative">
        <div className="absolute top-6 left-6 text-sm font-medium text-zinc-500">
          Jumlah Hari Kehadiran
        </div>
        {MOCK_MONTHLY.map((m, idx) => {
          const total = m.hadir + m.sakit + m.izin + m.alpa;
          const pct = total > 0 ? Math.round((m.hadir / total) * 100) : 0;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-blue-600">{pct}%</span>
              <div
                className="w-full bg-zinc-100 rounded-t-lg relative"
                style={{ height: "100%" }}
              >
                <div
                  className="absolute bottom-0 w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t-lg"
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-zinc-500 font-medium">{m.month}</span>
            </div>
          );
        })}
      </Card>

      {/* Detail Per Bulan */}
      <h2 className="text-lg font-bold text-zinc-900 mb-4">Detail Per Bulan</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        {MOCK_MONTHLY.map((m, idx) => {
          const total = m.hadir + m.sakit + m.izin + m.alpa;
          return (
            <Card key={idx}>
              <h3 className="font-bold text-zinc-900 mb-4">{m.month} 2026</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Hadir</p>
                  <p className="text-lg font-bold text-emerald-600">{m.hadir}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Sakit</p>
                  <p className="text-lg font-bold text-yellow-600">{m.sakit}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Izin</p>
                  <p className="text-lg font-bold text-blue-600">{m.izin}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500">Alpa</p>
                  <p className="text-lg font-bold text-red-600">{m.alpa}</p>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="mt-4 h-2 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: `${total > 0 ? (m.hadir / total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                Total {total} hari efektif
              </p>
            </Card>
          );
        })}
      </div>

      {/* ── Bagian 2: Laporan Perkembangan Siswa ─────────────────────────── */}
      <div className="border-t border-zinc-200 pt-8">
        <h2 className="text-lg font-bold text-zinc-900 mb-2 flex items-center gap-2">
          <BookOpen size={18} className="text-emerald-600" />
          Laporan Perkembangan Siswa
        </h2>
        <p className="text-sm text-zinc-500 mb-6">
          Catatan yang dikirimkan guru tentang perkembangan Deni Hidayat.
        </p>

        {MOCK_REPORTS.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-400">
            <BookOpen size={36} className="mx-auto mb-3 opacity-25" />
            <p>Belum ada laporan dari guru.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {MOCK_REPORTS.map((report) => {
              const isOpen = expandedReport === report.id;
              return (
                <Card
                  key={report.id}
                  className="cursor-pointer hover:border-emerald-100 transition-colors"
                  interactive
                >
                  <button
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedReport(isOpen ? null : report.id)
                    }
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">
                            {report.period}
                          </p>
                          <p className="text-xs text-zinc-400">
                            Laporan dari guru wali kelas
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`text-zinc-400 shrink-0 transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                    {/* Preview when collapsed */}
                    {!isOpen && (
                      <p className="mt-3 text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                        {report.notes}
                      </p>
                    )}
                  </button>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="mt-4 pt-4 border-t border-zinc-100">
                      <p className="text-sm text-zinc-700 leading-relaxed">
                        {report.notes}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
