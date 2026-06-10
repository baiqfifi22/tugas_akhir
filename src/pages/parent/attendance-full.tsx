import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import Link from "next/link";
import {
  CalendarDays,
  UserCheck,
  UserX,
  Clock,
  Loader2,
  AlertCircle,
  ArrowLeft,
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

export default function ParentAttendanceFull() {
  const [attendanceData, setAttendanceData] = useState<AttendanceRow[]>([]);
  const [stats, setStats] = useState<MonthlyStats>({ hadir: 0, sakit: 0, izin: 0, alpa: 0 });
  const [childName, setChildName] = useState("");
  const [childNis, setChildNis] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    setError("");

    fetch("/api/parent/attendance?full=true")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Gagal memuat data");
        setChildName(data.childName || "");
        setChildNis(data.childNis || "");
        setAttendanceData(data.attendanceData || []);
        setStats(data.stats || { hadir: 0, sakit: 0, izin: 0, alpa: 0 });
      })
      .catch((err) => {
        console.error(err);
        setError("Gagal memuat data riwayat lengkap. Coba refresh halaman.");
      })
      .finally(() => setIsLoading(false));
  }, []);

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
          <Link
            href="/parent/attendance"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-3"
          >
            <ArrowLeft size={14} />
            Kembali ke Rekap Bulanan
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Riwayat Kehadiran Lengkap</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {childName ? (
              <>
                Semua catatan kehadiran{" "}
                <span className="font-semibold text-zinc-700">{childName}</span>
                {childNis && <span className="text-zinc-400"> · NIS {childNis}</span>}
              </>
            ) : (
              "Memuat data anak..."
            )}
          </p>
        </div>
        {!isLoading && totalAbsensi > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 flex items-center gap-2 self-start sm:self-center">
            <span className="text-sm text-zinc-600 font-medium">Tingkat Kehadiran (Wajib):</span>
            <span
              className={`text-lg font-black ${
                pctHadir >= 80
                  ? "text-emerald-600"
                  : pctHadir >= 60
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {pctHadir}%
            </span>
          </div>
        )}
      </div>

      {/* Loading / Error */}
      {isLoading ? (
        <div className="flex items-center justify-center py-32 gap-3 text-zinc-400">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="text-sm">Memuat riwayat kehadiran lengkap...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-32 gap-3 text-red-500">
          <AlertCircle size={28} />
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        <>
          {/* Stats Cards (Wajib Only) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card interactive className="border-t-4 border-t-emerald-500">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hadir (Wajib)</p>
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
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sakit (Wajib)</p>
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
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Izin (Wajib)</p>
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
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Alpa (Wajib)</p>
                  <h3 className="text-2xl font-black text-zinc-900">{stats.alpa}</h3>
                </div>
              </div>
            </Card>
          </div>

          {/* Full Table */}
          <Card className="p-0 overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900">Seluruh Catatan Kehadiran</h2>
              <span className="text-xs text-zinc-400">
                Total {attendanceData.length} rekaman absensi
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
                {attendanceData.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} className="text-center py-16 text-zinc-400">
                      <CalendarDays size={40} className="mx-auto mb-2 opacity-20" />
                      Belum ada data kehadiran untuk siswa ini di tahun ajaran aktif.
                    </Td>
                  </Tr>
                ) : (
                  attendanceData.map((row, idx) => (
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
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusStyle(
                            row.status
                          )}`}
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
        </>
      )}
    </Layout>
  );
}
