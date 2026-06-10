import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Users, UserCheck, BookOpen, ClipboardCheck, Loader2, TrendingUp } from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ADMIN"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

interface ChartBar { label: string; hadir: number; absen: number; }

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [kelasBelumAbsen, setKelasBelumAbsen] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartBar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [scope, setScope] = useState<"weekly" | "monthly" | "yearly">("weekly");

  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/admin/dashboard?scope=${scope}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStats(d.stats);
          setKelasBelumAbsen(d.kelasBelumAbsen || []);
          setChartData(d.chartData || []);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isLoading) return;
    setIsChartLoading(true);
    fetch(`/api/admin/dashboard?scope=${scope}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setChartData(d.chartData || []);
        }
      })
      .catch(console.error)
      .finally(() => setIsChartLoading(false));
  }, [scope, isLoading]);

  const statCards = stats
    ? [
        { label: "Guru Aktif", value: stats.totalGuru, icon: UserCheck, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Siswa Aktif", value: stats.totalSiswa, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Total Kelas", value: stats.totalKelas, icon: BookOpen, color: "text-violet-600", bg: "bg-violet-50" },
        { label: "Kelas Sudah Absen", value: `${stats.totalKelasAbsenHariIni} / ${stats.totalKelas}`, icon: ClipboardCheck, color: "text-orange-600", bg: "bg-orange-50" },
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

          {/* Full Width Chart & Class Status */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Bar Chart Lebar Penuh */}
            <Card className="lg:col-span-5 w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-500" />
                  <h2 className="font-bold text-zinc-900">
                    {scope === "weekly"
                      ? "Kehadiran 7 Hari Terakhir"
                      : scope === "monthly"
                      ? "Kehadiran 30 Hari Terakhir"
                      : "Kehadiran Tahun Ajaran Aktif"}
                  </h2>
                </div>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="weekly">Rangkuman Mingguan (7 Hari)</option>
                  <option value="monthly">Rangkuman Bulanan (30 Hari)</option>
                  <option value="yearly">Tahun Ajaran Aktif</option>
                </select>
              </div>

              {isChartLoading ? (
                <div className="flex items-center justify-center h-48 text-zinc-400 gap-2">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="text-sm">Memuat grafik...</span>
                </div>
              ) : chartData.length === 0 ? (
                <p className="text-zinc-400 text-sm text-center py-8">Belum ada data</p>
              ) : (
                <div className="overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin">
                  <div className="flex items-end gap-2 h-48 min-w-[650px] md:min-w-0 pt-6">
                    {chartData.map((d, i) => {
                      const total = d.hadir + d.absen;
                      const hadirH = total > 0 ? (d.hadir / maxVal) * 150 : 0;
                      const absenH = total > 0 ? (d.absen / maxVal) * 150 : 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group min-w-[32px] relative">
                          {/* Value tooltip */}
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-[10px] py-1 px-1.5 rounded absolute -translate-y-8 pointer-events-none z-10 flex flex-col items-center shadow-lg font-medium leading-normal">
                            <span>Hadir: {d.hadir}</span>
                            <span>Absen: {d.absen}</span>
                          </div>

                          <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: 150 }}>
                            <div
                              className="w-full bg-emerald-400 rounded-t-sm transition-all duration-500 hover:bg-emerald-500 cursor-pointer"
                              style={{ height: hadirH }}
                              title={`Hadir: ${d.hadir}`}
                            />
                            <div
                              className="w-full bg-red-300 rounded-t-sm transition-all duration-500 hover:bg-red-400 cursor-pointer"
                              style={{ height: absenH }}
                              title={`Absen: ${d.absen}`}
                            />
                          </div>
                          <span className="text-[10px] text-zinc-400 text-center leading-tight whitespace-nowrap font-medium">{d.label}</span>
                        </div>
                      );
                    })}
                  </div>
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

            {/* Status Absensi Kelas Hari Ini */}
            <Card className="lg:col-span-5 w-full">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardCheck size={18} className="text-zinc-500" />
                <h2 className="font-bold text-zinc-900">Status Absensi Kelas Hari Ini</h2>
              </div>
              
              {kelasBelumAbsen.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  Semua kelas ({stats?.totalKelas} kelas) sudah mencatatkan absensi hari ini!
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    Ada {kelasBelumAbsen.length} kelas yang belum mencatatkan absensi hari ini.
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {kelasBelumAbsen.map((namaKelas, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        Kelas {namaKelas}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </Layout>
  );
}
