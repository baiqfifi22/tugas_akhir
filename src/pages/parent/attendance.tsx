import React, { useState, useEffect, useMemo } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import Link from "next/link";
import {
  Calendar,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  FileText,
  User,
  Loader2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Users,
  BookOpen,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ORANG_TUA"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

interface AttendanceRow {
  date: string;
  day: string;
  status: string;
  note: string;
  mapel: string;
  guruNama?: string;
  rawDate?: string;
}

interface MonthlyStats {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
}

interface LimitInfo {
  totalIzinAlpa: number;
  maxIzinAlpa: number;
}

interface NarrativeReport {
  period: string;
  teacher: string;
  isStructured: boolean;
  notes: string;
  perilaku?: string | null;
  akademik?: string | null;
  kedisiplinan?: string | null;
  catatanKhusus?: string | null;
  rekomendasi?: string | null;
}

interface LaporanGuru {
  id: string;
  guruNama: string;
  guruId: number;
  isWaliKelas: boolean;
  tanggal: string;
  isStructured: boolean;
  notes: string;
  perilaku?: string | null;
  akademik?: string | null;
  kedisiplinan?: string | null;
  catatanKhusus?: string | null;
  rekomendasi?: string | null;
}

// ── Helper: tampilkan laporan terstruktur atau plain text ────────────────────
function StructuredReportDisplay({
  report,
  compact = false,
}: {
  report: NarrativeReport | LaporanGuru;
  compact?: boolean;
}) {
  if (!report.isStructured) {
    return (
      <p
        className={`text-zinc-700 leading-relaxed ${compact ? "text-xs" : "text-sm italic"}`}
      >
        {report.notes || "—"}
      </p>
    );
  }

  const fields = [
    { label: "Perilaku & Sikap", value: report.perilaku },
    { label: "Perkembangan Akademik", value: report.akademik },
    { label: "Kedisiplinan", value: report.kedisiplinan },
    { label: "Hal yang Perlu Diperhatikan", value: report.catatanKhusus },
    { label: "Pesan & Rekomendasi", value: report.rekomendasi },
  ].filter((f) => f.value && f.value.trim());

  if (fields.length === 0) {
    return (
      <p className={`text-zinc-500 ${compact ? "text-xs" : "text-sm"}`}>
        {report.notes || "—"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.label}>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
            {f.label}
          </p>
          <p
            className={`text-zinc-700 leading-relaxed whitespace-pre-wrap ${
              compact ? "text-xs" : "text-sm"
            }`}
          >
            {f.value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Helper: Badge status ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "Hadir"
      ? "bg-emerald-100 text-emerald-800"
      : status === "Sakit"
      ? "bg-yellow-100 text-yellow-800"
      : status === "Izin"
      ? "bg-blue-100 text-blue-800"
      : status === "Alpa"
      ? "bg-red-100 text-red-800"
      : "bg-zinc-100 text-zinc-600";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}
    >
      {status}
    </span>
  );
}

export default function ParentAttendance() {
  const [filterType, setFilterType] = useState<"tahun" | "bulan">("tahun");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState<
    { value: string; label: string }[]
  >([]);
  const [academicYearName, setAcademicYearName] = useState("");

  const [attendanceData, setAttendanceData] = useState<AttendanceRow[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRow[]>([]);
  const [stats, setStats] = useState<MonthlyStats>({
    hadir: 0,
    sakit: 0,
    izin: 0,
    alpa: 0,
  });
  const [limitInfo, setLimitInfo] = useState<LimitInfo | null>(null);
  const [report, setReport] = useState<NarrativeReport | null>(null);
  const [laporanSemuaGuru, setLaporanSemuaGuru] = useState<LaporanGuru[]>([]);
  const [childName, setChildName] = useState("");
  const [childNis, setChildNis] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [showAllLaporan, setShowAllLaporan] = useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    setError("");

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    let url = `/api/parent/attendance?view=${filterType}&today=${todayStr}`;
    if (filterType === "bulan" && selectedMonth) {
      url += `&month=${selectedMonth}`;
    }

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Gagal memuat data");
        setChildName(data.childName || "");
        setChildNis(data.childNis || "");
        setAttendanceData(data.attendanceData || []);
        setTodayAttendance(data.todayAttendance || []);
        setStats(data.stats || { hadir: 0, sakit: 0, izin: 0, alpa: 0 });
        setLimitInfo(data.limitInfo || null);
        setReport(data.report || null);
        setLaporanSemuaGuru(data.laporanSemuaGuru || []);
        if (data.availableMonths) setAvailableMonths(data.availableMonths);
        if (data.academicYearName) setAcademicYearName(data.academicYearName);

        // Fix Bug #6: set default selectedMonth ke bulan saat ini
        if (
          !selectedMonth &&
          data.availableMonths &&
          data.availableMonths.length > 0
        ) {
          const currentMonthStr = `${now.getFullYear()}-${String(
            now.getMonth() + 1
          ).padStart(2, "0")}`;
          const hasCurrent = data.availableMonths.some(
            (m: { value: string }) => m.value === currentMonthStr
          );
          setSelectedMonth(
            hasCurrent ? currentMonthStr : data.availableMonths[data.availableMonths.length - 1].value
          );
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal memuat data kehadiran. Coba refresh halaman.");
      })
      .finally(() => setIsLoading(false));
  }, [filterType, selectedMonth]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const totalAbsensi = stats.hadir + stats.sakit + stats.izin + stats.alpa;
  const pctHadir =
    totalAbsensi > 0 ? Math.round((stats.hadir / totalAbsensi) * 100) : 0;

  // Group attendanceData by rawDate for per-day accordion (Feature #7)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, AttendanceRow[]>();
    attendanceData.forEach((row) => {
      const key = row.rawDate || row.date;
      const existing = map.get(key) || [];
      map.set(key, [...existing, row]);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [attendanceData]);

  const toggleDate = (dateKey: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(dateKey)) next.delete(dateKey);
      else next.add(dateKey);
      return next;
    });
  };

  // Other guru laporan (excluding wali kelas from the main card)
  const otherGuruLaporan = laporanSemuaGuru.filter((l) => !l.isWaliKelas);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout role="parent">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Rekap Kehadiran</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {childName ? (
              <>
                Memantau kehadiran{" "}
                <span className="font-semibold text-zinc-700">{childName}</span>
                {childNis && (
                  <span className="text-zinc-400"> · NIS {childNis}</span>
                )}
              </>
            ) : (
              "Memuat data anak..."
            )}
          </p>
        </div>
        {childName && (
          <Link
            href="/parent/attendance-full"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm transition-colors shrink-0"
          >
            <ExternalLink size={16} />
            Riwayat Lengkap
          </Link>
        )}
      </div>

      {/* ── Feature #5: Notifikasi Batas Kehadiran (Izin & Alpa) ───────────────────────── */}
      {limitInfo && limitInfo.totalIzinAlpa > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {(() => {
            const used = limitInfo.totalIzinAlpa;
            const max = limitInfo.maxIzinAlpa;
            const remaining = Math.max(0, max - used);
            const isDanger = used >= max;
            const isWarning = used >= 7 && !isDanger;
            return (
              <div
                className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
                  isDanger
                    ? "bg-red-50 border-red-200 text-red-800"
                    : isWarning
                    ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                    : "bg-blue-50 border-blue-200 text-blue-700"
                }`}
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">
                    Batas Ketidakhadiran (Izin &amp; Alpa):{" "}
                    <span className="text-base">{used}</span> dari{" "}
                    <span className="text-base">{max}</span> hari terpakai
                    {isDanger && " 🚨"}
                  </p>
                  <p className="text-xs mt-0.5 opacity-80">
                    {remaining > 0
                      ? `Sisa ${remaining} hari lagi sebelum batas maksimal ketidakhadiran`
                      : "Batas maksimal ketidakhadiran (Izin & Alpa) sudah tercapai! Segera hubungi wali kelas."}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Filter Mode */}
      <Card className="mb-6 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-50/40 border-blue-100/80">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar size={18} className="text-blue-600 animate-pulse" />
          <span className="text-sm font-bold text-zinc-900 mr-2">
            Rekap Absensi:
          </span>

          <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 border border-zinc-200">
            <button
              type="button"
              id="filter-tahun"
              onClick={() => setFilterType("tahun")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                filterType === "tahun"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Tahun Ajaran
            </button>
            <button
              type="button"
              id="filter-bulan"
              onClick={() => setFilterType("bulan")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${
                filterType === "bulan"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Per Bulan
            </button>
          </div>

          {/* Fix Bug #6: Month selector — now shows current month */}
          {filterType === "bulan" && availableMonths.length > 0 && (
            <select
              id="select-bulan"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-blue-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white shadow-sm"
            >
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          )}

          {filterType === "tahun" && academicYearName && (
            <span className="text-xs bg-blue-100/70 text-blue-700 px-3 py-1.5 rounded-lg font-bold border border-blue-200/50">
              {academicYearName}
            </span>
          )}
        </div>

        {!isLoading && totalAbsensi > 0 && (
          <span className="text-sm text-zinc-500 font-medium">
            Kehadiran wali kelas:{" "}
            <span
              className={`font-black ${
                pctHadir >= 80
                  ? "text-emerald-600"
                  : pctHadir >= 60
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {pctHadir}%
            </span>
          </span>
        )}
      </Card>

      {/* Loading / Error */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32 gap-3 text-zinc-400">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="text-sm">Memuat data kehadiran...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-32 gap-3 text-red-500">
          <AlertCircle size={28} />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card interactive className="border-t-4 border-t-emerald-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Hadir
                  </p>
                  <h3 className="text-2xl font-black text-zinc-900">
                    {stats.hadir}
                  </h3>
                </div>
              </div>
            </Card>
            <Card interactive className="border-t-4 border-t-yellow-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Sakit
                  </p>
                  <h3 className="text-2xl font-black text-zinc-900">
                    {stats.sakit}
                  </h3>
                </div>
              </div>
            </Card>
            <Card interactive className="border-t-4 border-t-blue-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Izin
                  </p>
                  <h3 className="text-2xl font-black text-zinc-900">
                    {stats.izin}
                  </h3>
                </div>
              </div>
            </Card>
            <Card interactive className="border-t-4 border-t-red-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                  <UserX size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Alpa
                  </p>
                  <h3 className="text-2xl font-black text-zinc-900">
                    {stats.alpa}
                  </h3>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left: Tabel / Accordion ──────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Detail Kehadiran Hari Ini */}
              <Card className="p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between">
                  <h2 className="text-lg font-bold text-zinc-900">
                    Detail Kehadiran Hari Ini
                  </h2>
                  <span className="text-xs text-zinc-400">
                    {todayAttendance.length} catatan
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  <TableWrapper>
                    <Thead>
                      <Tr>
                        <Th>Tanggal</Th>
                        <Th>Mata Pelajaran</Th>
                        <Th>Status</Th>
                        <Th>Ket.</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {todayAttendance.length === 0 ? (
                        <Tr>
                          <Td colSpan={4} className="text-center py-10 text-zinc-400">
                            <CalendarDays size={32} className="mx-auto mb-2 opacity-20" />
                            Belum ada data kehadiran untuk hari ini.
                          </Td>
                        </Tr>
                      ) : (
                        todayAttendance.map((row, idx) => (
                          <Tr key={idx}>
                            <Td>
                              <div className="font-semibold text-zinc-900 text-sm">
                                {row.date}
                              </div>
                              <div className="text-xs text-zinc-400">{row.day}</div>
                            </Td>
                            <Td className="text-zinc-700 font-medium text-xs sm:text-sm">
                              {row.mapel === "MATA_PELAJARAN_WAJIB"
                                ? "Wali Kelas"
                                : row.mapel
                                ? row.mapel.replace(/_/g, " ")
                                : "—"}
                            </Td>
                            <Td>
                              <StatusBadge status={row.status} />
                            </Td>
                            <Td className="text-zinc-500 text-xs">{row.note}</Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </TableWrapper>
                </div>
              </Card>

              {/* ── Feature #7: Per-Day Accordion (Per Bulan view) ───────── */}
              {filterType === "bulan" && groupedByDate.length > 0 && (
                <Card className="p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-900">
                      Rekap Per Hari — {availableMonths.find(m => m.value === selectedMonth)?.label}
                    </h2>
                    <span className="text-xs text-zinc-400">
                      {groupedByDate.length} hari
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-100 max-h-[500px] overflow-y-auto">
                    {groupedByDate.map(([dateKey, rows]) => {
                      const isExpanded = expandedDates.has(dateKey);
                      const firstRow = rows[0];
                      const hasAbsent = rows.some(
                        (r) => r.status === "Alpa" || r.status === "Sakit" || r.status === "Izin"
                      );
                      return (
                        <div key={dateKey}>
                          <button
                            id={`day-${dateKey}`}
                            type="button"
                            onClick={() => toggleDate(dateKey)}
                            className={`w-full flex items-center justify-between px-6 py-3.5 text-left hover:bg-zinc-50 transition-colors ${
                              isExpanded ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-center w-10">
                                <p className="text-xs text-zinc-400 font-medium leading-none">
                                  {firstRow.day?.slice(0, 3) || ""}
                                </p>
                                <p className="text-sm font-bold text-zinc-800 leading-tight mt-0.5">
                                  {firstRow.date?.split(" ")[0]}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {rows.map((r, i) => (
                                  <StatusBadge key={i} status={r.status} />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              <span className="text-xs text-zinc-400">
                                {rows.length} mapel
                              </span>
                              {isExpanded ? (
                                <ChevronUp size={16} className="text-zinc-400" />
                              ) : (
                                <ChevronDown size={16} className="text-zinc-400" />
                              )}
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="px-6 pb-4 bg-blue-50/30 border-t border-blue-100/50">
                              <div className="pt-3 space-y-2">
                                {rows.map((r, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-sm bg-white rounded-lg px-4 py-2.5 border border-zinc-100 shadow-sm"
                                  >
                                    <div>
                                      <p className="font-semibold text-zinc-800 text-xs">
                                        {r.mapel === "MATA_PELAJARAN_WAJIB"
                                          ? "Wali Kelas"
                                          : r.mapel?.replace(/_/g, " ") || "—"}
                                      </p>
                                      {r.guruNama && (
                                        <p className="text-xs text-zinc-400 mt-0.5">
                                          {r.guruNama}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <StatusBadge status={r.status} />
                                      {r.note && r.note !== "—" && (
                                        <span className="text-xs text-zinc-400 max-w-[120px] truncate">
                                          {r.note}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>

            {/* ── Right: Laporan & Semua Guru ──────────────────────────────── */}
            <div className="lg:col-span-1 space-y-4">

              {/* Laporan Wali Kelas — dengan structured fields (Feature #3) */}
              <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                {report ? (
                  <>
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-blue-100/50">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-zinc-900 leading-tight">
                          Laporan Wali Kelas
                        </h2>
                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">
                          {report.period}
                        </p>
                      </div>
                    </div>

                    {report.isStructured ? (
                      <StructuredReportDisplay report={report} />
                    ) : (
                      <div className="relative">
                        <span className="text-4xl text-blue-200 absolute -top-4 -left-2 font-serif">
                          "
                        </span>
                        <p className="text-sm text-zinc-700 leading-relaxed relative z-10 pl-4 italic">
                          {report.notes}
                        </p>
                      </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 font-medium">
                          Ditulis oleh Wali Kelas
                        </p>
                        <p className="text-sm font-bold text-zinc-900">
                          {report.teacher}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400 p-6 text-center min-h-[160px]">
                    <FileText size={40} className="mb-3 opacity-20" />
                    <p className="text-sm">
                      Belum ada laporan dari wali kelas.
                    </p>
                  </div>
                )}
              </Card>

              {/* ── Feature #9: Tombol Laporan Semua Guru ─────────────────── */}
              {laporanSemuaGuru.length > 0 && (
                <div>
                  <button
                    id="btn-semua-laporan"
                    type="button"
                    onClick={() => setShowAllLaporan((p) => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 hover:border-blue-200 transition-all text-sm font-semibold text-zinc-700 shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <Users size={16} className="text-blue-500" />
                      Laporan dari Semua Guru
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-bold">
                        {laporanSemuaGuru.length}
                      </span>
                    </span>
                    {showAllLaporan ? (
                      <ChevronUp size={16} className="text-zinc-400" />
                    ) : (
                      <ChevronDown size={16} className="text-zinc-400" />
                    )}
                  </button>

                  {showAllLaporan && (
                    <div className="mt-2 space-y-3">
                      {laporanSemuaGuru.map((lap) => (
                        <Card
                          key={lap.id}
                          className={`border-l-4 ${
                            lap.isWaliKelas
                              ? "border-l-blue-500"
                              : "border-l-zinc-300"
                          } bg-white py-4 px-5`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <BookOpen
                                size={14}
                                className={
                                  lap.isWaliKelas
                                    ? "text-blue-500"
                                    : "text-zinc-400"
                                }
                              />
                              <p className="text-sm font-bold text-zinc-800">
                                {lap.guruNama}
                              </p>
                              {lap.isWaliKelas && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                                  Wali Kelas
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-zinc-400">
                              {lap.tanggal}
                            </span>
                          </div>
                          <StructuredReportDisplay report={lap} compact />
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
