import React, { useState, useEffect, useCallback } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import {
  BarChart2,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Users,
  TrendingUp,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["GURU", "KEPALA_SEKOLAH"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

interface SummaryRow {
  name: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
}

interface TodaySummary {
  sudahAbsen: boolean;
  hadir?: number;
  sakit?: number;
  izin?: number;
  alpa?: number;
  total?: number;
}

interface RekapData {
  week: string;
  totalSiswa: number;
  summaryData: SummaryRow[];
  dailyPercent: Record<string, number>;
  todaySummary: TodaySummary;
  totalSesi: number;
}

const DAY_LABELS: Record<string, string> = {
  mon: "Senin",
  tue: "Selasa",
  wed: "Rabu",
  thu: "Kamis",
  fri: "Jumat",
};

const STATUS_STYLE: Record<string, string> = {
  H: "text-emerald-700 bg-emerald-50 border border-emerald-200",
  S: "text-yellow-700 bg-yellow-50 border border-yellow-200",
  I: "text-blue-700 bg-blue-50 border border-blue-200",
  A: "text-red-700 bg-red-50 border border-red-200",
  "-": "text-zinc-400 bg-zinc-50",
};

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default function ClassRekap() {
  const router = useRouter();
  const { id } = router.query;
  const classId = typeof id === "string" ? id : "";

  const [weekFilter, setWeekFilter] = useState("");
  const [rekapData, setRekapData] = useState<RekapData | null>(null);
  const [kelasNama, setKelasNama] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRekap = useCallback(async (kelasId: string, week: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/teacher/class/${kelasId}/rekap?week=${week}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setRekapData(data);
        if (data.kelasNama) setKelasNama(data.kelasNama);
      } else {
        setError(data.message || "Gagal memuat data rekap");
      }
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const currentWeek = getISOWeek(new Date());
    setWeekFilter(currentWeek);
  }, []);

  useEffect(() => {
    if (classId && weekFilter) {
      fetchRekap(classId, weekFilter);
    }
  }, [classId, weekFilter, fetchRekap]);

  const days = ["mon", "tue", "wed", "thu", "fri"] as const;

  // Bar chart: gunakan dailyPercent jika ada data, jika tidak 0
  const barData = rekapData
    ? days.map((d) => ({ day: DAY_LABELS[d], pct: rekapData.dailyPercent[d] ?? 0 }))
    : days.map((d) => ({ day: DAY_LABELS[d], pct: 0 }));

  const maxPct = Math.max(...barData.map((b) => b.pct), 1);

  return (
    <Layout role="teacher" hasSidebar={true}>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Rekap Kehadiran — Kelas {(kelasNama || "...").toUpperCase()}
          </h1>
          <p className="text-zinc-500">
            Rekapitulasi kehadiran siswa per minggu.
          </p>
        </div>
      </div>

      {/* Kartu Summary Hari Ini */}
      {rekapData?.todaySummary?.sudahAbsen && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/70">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-800 mb-3">
                Absensi hari ini sudah dilakukan
              </p>
              <div className="flex gap-6 flex-wrap">
                {[
                  { label: "Hadir", val: rekapData.todaySummary.hadir ?? 0, color: "text-emerald-700", bg: "bg-emerald-100" },
                  { label: "Sakit", val: rekapData.todaySummary.sakit ?? 0, color: "text-yellow-700", bg: "bg-yellow-100" },
                  { label: "Izin", val: rekapData.todaySummary.izin ?? 0, color: "text-blue-700", bg: "bg-blue-100" },
                  { label: "Alpa", val: rekapData.todaySummary.alpa ?? 0, color: "text-red-700", bg: "bg-red-100" },
                ].map(({ label, val, color, bg }) => (
                  <div key={label} className={`${bg} rounded-xl px-5 py-3 text-center min-w-[70px]`}>
                    <p className={`text-2xl font-bold ${color}`}>{val}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
                  </div>
                ))}
                <div className="bg-zinc-100 rounded-xl px-5 py-3 text-center min-w-[70px]">
                  <p className="text-2xl font-bold text-zinc-700">{rekapData.todaySummary.total ?? 0}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Total</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Minggu */}
      <Card className="mb-6 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Calendar size={16} className="text-zinc-500" />
          <span className="text-sm font-medium text-zinc-700">Filter Minggu:</span>
          <input
            type="week"
            value={weekFilter}
            onChange={(e) => setWeekFilter(e.target.value)}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-4">
          {rekapData && (
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Users size={14} />
              <span>{rekapData.totalSiswa} siswa</span>
              <span className="mx-1">·</span>
              <TrendingUp size={14} />
              <span>{rekapData.totalSesi} sesi</span>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => classId && weekFilter && fetchRekap(classId, weekFilter)}
          >
            <RefreshCw size={16} /> Refresh
          </Button>
        </div>
      </Card>

      {/* Loading / Error state */}
      {loading && (
        <Card className="mb-6 py-12 text-center text-zinc-400">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2" />
          <p className="text-sm">Memuat data rekap...</p>
        </Card>
      )}
      {error && !loading && (
        <Card className="mb-6 py-8 text-center border-red-200 bg-red-50">
          <p className="text-red-600 font-medium">{error}</p>
        </Card>
      )}

      {!loading && !error && rekapData && (
        <>
          {/* Bar Chart Kehadiran */}
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <BarChart2 size={18} className="text-blue-600" />
            Persentase Kehadiran Minggu Ini
          </h2>
          <Card className="mb-8">
            {rekapData.totalSesi === 0 ? (
              <div className="h-48 flex items-center justify-center text-zinc-400 text-sm">
                Belum ada sesi absensi pada minggu ini
              </div>
            ) : (
              <div className="h-56 flex items-end gap-4 pt-8 px-2 relative">
                <div className="absolute top-4 left-4 text-xs font-medium text-zinc-400">
                  % Kehadiran
                </div>
                {barData.map(({ day, pct }) => (
                  <div
                    key={day}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <span className="text-sm font-bold text-blue-600">
                      {pct > 0 ? `${pct}%` : ""}
                    </span>
                    <div className="w-full bg-zinc-100 rounded-t-lg relative h-40 flex items-end">
                      <div
                        style={{ height: `${(pct / maxPct) * 100}%` }}
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          pct >= 80
                            ? "bg-emerald-500"
                            : pct >= 60
                            ? "bg-yellow-400"
                            : pct > 0
                            ? "bg-red-400"
                            : "bg-zinc-200"
                        }`}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 font-medium">{day}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tabel Detail Per Siswa */}
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-blue-600" />
            Detail Kehadiran Siswa
          </h2>
          <Card className="p-0 overflow-hidden mb-4">
            <TableWrapper>
              <Thead>
                <Tr>
                  <Th>No</Th>
                  <Th>Nama Siswa</Th>
                  {days.map((d) => (
                    <Th key={d} className="text-center w-20">
                      {DAY_LABELS[d]}
                    </Th>
                  ))}
                  <Th className="text-center">H</Th>
                  <Th className="text-center">%</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rekapData.summaryData.length === 0 ? (
                  <Tr>
                    <Td colSpan={9} className="text-center text-zinc-400 py-8">
                      Belum ada data kehadiran untuk minggu ini
                    </Td>
                  </Tr>
                ) : (
                  rekapData.summaryData.map((row, idx) => {
                    const hadirCount = days.filter((d) => row[d] === "H").length;
                    const hasDataDays = days.filter((d) => row[d] !== "-").length;
                    const pctHadir = hasDataDays > 0
                      ? Math.round((hadirCount / hasDataDays) * 100)
                      : null;

                    return (
                      <Tr key={idx}>
                        <Td className="text-zinc-400 text-sm w-10">{idx + 1}</Td>
                        <Td className="font-medium text-zinc-900">{row.name}</Td>
                        {days.map((d) => (
                          <Td key={d} className="text-center">
                            <span
                              className={`inline-flex w-8 h-8 items-center justify-center rounded-lg font-bold text-xs ${
                                STATUS_STYLE[row[d]] ?? STATUS_STYLE["-"]
                              }`}
                            >
                              {row[d]}
                            </span>
                          </Td>
                        ))}
                        <Td className="text-center font-bold text-emerald-600">
                          {hadirCount}
                        </Td>
                        <Td className="text-center">
                          {pctHadir !== null ? (
                            <span
                              className={`text-xs font-semibold ${
                                pctHadir >= 80
                                  ? "text-emerald-600"
                                  : pctHadir >= 60
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {pctHadir}%
                            </span>
                          ) : (
                            <span className="text-zinc-300 text-xs">—</span>
                          )}
                        </Td>
                      </Tr>
                    );
                  })
                )}
              </Tbody>
            </TableWrapper>
          </Card>

          {/* Legend */}
          <div className="flex gap-4 flex-wrap text-xs text-zinc-500 mt-2 px-1">
            {[
              { code: "H", label: "Hadir", color: "bg-emerald-100 text-emerald-700" },
              { code: "S", label: "Sakit", color: "bg-yellow-100 text-yellow-700" },
              { code: "I", label: "Izin", color: "bg-blue-100 text-blue-700" },
              { code: "A", label: "Alpa", color: "bg-red-100 text-red-700" },
              { code: "-", label: "Tidak ada sesi", color: "bg-zinc-100 text-zinc-400" },
            ].map(({ code, label, color }) => (
              <div key={code} className="flex items-center gap-1.5">
                <span className={`inline-flex w-6 h-6 items-center justify-center rounded font-bold text-xs ${color}`}>
                  {code}
                </span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </Layout>
  );
}
