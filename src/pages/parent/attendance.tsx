import React, { useState, useEffect } from "react";
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
}

interface MonthlyStats {
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
}

interface NarrativeReport {
  period: string;
  teacher: string;
  notes: string;
}

export default function ParentAttendance() {
  const [filterType, setFilterType] = useState<"tahun" | "bulan">("tahun");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableMonths, setAvailableMonths] = useState<{ value: string; label: string }[]>([]);
  const [academicYearName, setAcademicYearName] = useState("");


  const [todayAttendance, setTodayAttendance] = useState<AttendanceRow[]>([]);
  const [stats, setStats] = useState<MonthlyStats>({ hadir: 0, sakit: 0, izin: 0, alpa: 0 });
  const [report, setReport] = useState<NarrativeReport | null>(null);
  const [childName, setChildName] = useState("");
  const [childNis, setChildNis] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");

    const now = new Date();
    const localYear = now.getFullYear();
    const localMonth = String(now.getMonth() + 1).padStart(2, "0");
    const localDay = String(now.getDate()).padStart(2, "0");
    const todayStr = `${localYear}-${localMonth}-${localDay}`;

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

        setTodayAttendance(data.todayAttendance || []);
        setStats(data.stats || { hadir: 0, sakit: 0, izin: 0, alpa: 0 });
        setReport(data.report || null);
        if (data.availableMonths) {
          setAvailableMonths(data.availableMonths);
        }
        if (data.academicYearName) {
          setAcademicYearName(data.academicYearName);
        }
        // Set default selectedMonth if empty and months are available
        if (!selectedMonth && data.availableMonths && data.availableMonths.length > 0) {
          const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
          const hasCurrentMonth = data.availableMonths.some((m: any) => m.value === currentMonthStr);
          setSelectedMonth(hasCurrentMonth ? currentMonthStr : data.availableMonths[0].value);
        }
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal memuat data kehadiran. Coba refresh halaman.");
      })
      .finally(() => setIsLoading(false));
  }, [filterType, selectedMonth]);

  const getStatusStyle = (status: string) => {
    if (status === "Hadir") return "bg-emerald-100 text-emerald-800";
    if (status === "Sakit") return "bg-yellow-100 text-yellow-800";
    if (status === "Izin") return "bg-blue-100 text-blue-800";
    if (status === "Alpa") return "bg-red-100 text-red-800";
    return "bg-zinc-100 text-zinc-600";
  };

  const totalAbsensi = stats.hadir + stats.sakit + stats.izin + stats.alpa;
  const pctHadir = totalAbsensi > 0 ? Math.round((stats.hadir / totalAbsensi) * 100) : 0;

  return (
    <Layout role="parent">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Rekap Kehadiran</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {childName ? (
              <>
                Memantau kehadiran{" "}
                <span className="font-semibold text-zinc-700">{childName}</span>
                {childNis && <span className="text-zinc-400"> · NIS {childNis}</span>}
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
            Lihat Riwayat Kehadiran Lengkap
          </Link>
        )}
      </div>

      {/* Filter Mode */}
      <Card className="mb-6 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-blue-50/40 border-blue-100/80">
        <div className="flex flex-wrap items-center gap-3">
          <Calendar size={18} className="text-blue-600 animate-pulse" />
          <span className="text-sm font-bold text-zinc-900 mr-2">Rekap Absensi:</span>
          
          {/* Segmented Controls */}
          <div className="inline-flex rounded-lg p-0.5 bg-zinc-100 border border-zinc-200">
            <button
              type="button"
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

          {/* Month Selector Dropdown - Only show if filterType === "bulan" */}
          {filterType === "bulan" && availableMonths.length > 0 && (
            <select
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

          {/* Display active academic year name if selected */}
          {filterType === "tahun" && academicYearName && (
            <span className="text-xs bg-blue-100/70 text-blue-700 px-3 py-1.5 rounded-lg font-bold border border-blue-200/50">
              {academicYearName}
            </span>
          )}
        </div>

        {!isLoading && totalAbsensi > 0 && (
          <span className="text-sm text-zinc-500 font-medium">
            Tingkat kehadiran:{" "}
            <span
              className={`font-black ${
                pctHadir >= 80 ? "text-emerald-600" : pctHadir >= 60 ? "text-yellow-600" : "text-red-600"
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
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hadir</p>
                  <h3 className="text-2xl font-black text-zinc-900">{stats.hadir}</h3>
                </div>
              </div>
            </Card>
            <Card interactive className="border-t-4 border-t-yellow-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sakit</p>
                  <h3 className="text-2xl font-black text-zinc-900">{stats.sakit}</h3>
                </div>
              </div>
            </Card>
            <Card interactive className="border-t-4 border-t-blue-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CalendarDays size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Izin</p>
                  <h3 className="text-2xl font-black text-zinc-900">{stats.izin}</h3>
                </div>
              </div>
            </Card>
            <Card interactive className="border-t-4 border-t-red-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
                  <UserX size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Alpa</p>
                  <h3 className="text-2xl font-black text-zinc-900">{stats.alpa}</h3>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tabel Detail */}
            <div className="lg:col-span-2">
              <Card className="p-0 overflow-hidden h-full">
                <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between">
                  <h2 className="text-lg font-bold text-zinc-900">Detail Kehadiran Hari Ini</h2>
                  <span className="text-xs text-zinc-400">
                    {todayAttendance.length} catatan
                  </span>
                </div>
                <TableWrapper>
                  <Thead>
                    <Tr>
                      <Th>Hari & Tanggal</Th>
                      <Th>Mata Pelajaran</Th>
                      <Th>Status</Th>
                      <Th>Keterangan</Th>
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
                            <div className="font-semibold text-zinc-900 text-sm">{row.date}</div>
                            <div className="text-xs text-zinc-400">{row.day}</div>
                          </Td>
                          <Td className="text-zinc-700 font-medium text-xs sm:text-sm">
                            {row.mapel ? row.mapel.replace(/_/g, " ") : "—"}
                          </Td>
                          <Td>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusStyle(row.status)}`}
                            >
                              {row.status}
                            </span>
                          </Td>
                          <Td className="text-zinc-500 text-xs">{row.note}</Td>
                        </Tr>
                      ))
                    )}
                  </Tbody>
                </TableWrapper>
              </Card>
            </div>

            {/* Laporan Narasi */}
            <div className="lg:col-span-1">
              <Card className="h-full bg-gradient-to-br from-blue-50 to-white border-blue-100">
                {report ? (
                  <>
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100/50">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-zinc-900 leading-tight">
                          Laporan Perkembangan
                        </h2>
                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">
                          {report.period}
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <span className="text-4xl text-blue-200 absolute -top-4 -left-2 font-serif">"</span>
                      <p className="text-sm text-zinc-700 leading-relaxed relative z-10 pl-4 italic">
                        {report.notes}
                      </p>
                    </div>
                    <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400 font-medium">Ditulis oleh Wali Kelas</p>
                        <p className="text-sm font-bold text-zinc-900">{report.teacher}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-6 text-center min-h-[200px]">
                    <FileText size={40} className="mb-3 opacity-20" />
                    <p className="text-sm">Belum ada laporan perkembangan untuk bulan ini.</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
