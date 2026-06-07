import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { Users, UserCheck, BookOpen, ClipboardCheck, Loader2, TrendingUp } from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ADMIN"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

interface ChartBar { label: string; hadir: number; absen: number; }
interface Log {
  id: number; date: string; cls: string; teacher: string;
  subject: string; present: number; absent: number; total: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [chartData, setChartData] = useState<ChartBar[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStats(d.stats);
          setLogs(d.logs);
          setChartData(d.chartData);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const statCards = stats
    ? [
        { label: "Guru Aktif", value: stats.totalGuru, icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Siswa Aktif", value: stats.totalSiswa, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Total Kelas", value: stats.totalKelas, icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Sesi Absensi Hari Ini", value: stats.totalSesiHariIni, icon: ClipboardCheck, color: "text-orange-600", bg: "bg-orange-50" },
      ]
    : [];

  const maxVal = chartData.length ? Math.max(...chartData.map((d) => d.hadir + d.absen), 1) : 1;

  return (
    <Layout role="admin">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard Utama</h1>
        <p className="text-zinc-500 text-sm mt-1">Ringkasan data sekolah hari ini.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32 gap-3 text-zinc-400">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <span className="text-sm">Memuat data dashboard...</span>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((s, i) => (
              <Card key={i} interactive>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                    <s.icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{s.label}</p>
                    <h3 className="text-3xl font-black text-zinc-900">{s.value}</h3>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Chart + Tabel */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
            {/* Bar Chart 7 Hari */}
            <Card className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-blue-500" />
                <h2 className="font-bold text-zinc-900">Kehadiran 7 Hari Terakhir</h2>
              </div>
              {chartData.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-8">Belum ada data</p>
              ) : (
                <div className="flex items-end gap-2 h-40">
                  {chartData.map((d, i) => {
                    const total = d.hadir + d.absen;
                    const hadirH = total > 0 ? (d.hadir / maxVal) * 130 : 0;
                    const absenH = total > 0 ? (d.absen / maxVal) * 130 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: 130 }}>
                          <div
                            className="w-full bg-emerald-400 rounded-t-sm transition-all duration-500"
                            style={{ height: hadirH }}
                            title={`Hadir: ${d.hadir}`}
                          />
                          <div
                            className="w-full bg-red-300 rounded-t-sm transition-all duration-500"
                            style={{ height: absenH }}
                            title={`Absen: ${d.absen}`}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-400 text-center leading-tight">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-zinc-100">
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="w-3 h-3 rounded-sm bg-emerald-400 inline-block" /> Hadir
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                  <span className="w-3 h-3 rounded-sm bg-red-300 inline-block" /> Absen
                </div>
              </div>
            </Card>

            {/* Tabel Absensi Terbaru */}
            <Card className="lg:col-span-3 p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200">
                <h2 className="font-bold text-zinc-900">Sesi Absensi Terbaru</h2>
              </div>
              <TableWrapper>
                <Thead>
                  <Tr>
                    <Th>Tanggal</Th>
                    <Th>Kelas & Guru</Th>
                    <Th>Mapel</Th>
                    <Th className="text-center">Hadir</Th>
                    <Th className="text-center">Absen</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {logs.length === 0 ? (
                    <Tr><Td colSpan={5} className="text-center py-8 text-zinc-400">Belum ada sesi absensi.</Td></Tr>
                  ) : (
                    logs.map((log) => (
                      <Tr key={log.id}>
                        <Td className="text-zinc-500 text-xs whitespace-nowrap">{log.date}</Td>
                        <Td>
                          <div className="font-medium text-zinc-900 text-sm">Kelas {log.cls}</div>
                          <div className="text-xs text-zinc-400">{log.teacher}</div>
                        </Td>
                        <Td className="text-zinc-500 text-xs">{log.subject.replace(/_/g, " ")}</Td>
                        <Td className="text-center font-bold text-emerald-600">{log.present}</Td>
                        <Td className="text-center font-bold text-red-500">{log.absent}</Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </TableWrapper>
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}
