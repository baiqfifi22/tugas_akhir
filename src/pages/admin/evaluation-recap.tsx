import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  BarChart2, School, User, Loader2, ChevronLeft, Star,
  Users, ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ADMIN"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

interface AspekRekap {
  aspek: string;
  rata: number;
  jumlah: number;
}

interface GuruRekap {
  id: number;
  nama: string;
  rekap: AspekRekap[];
  rataKeseluruhan: number;
}

interface RekapData {
  periode: { id: number; tahunAjaran: string; mulai: string; selesai: string };
  jumlahSubmit: number;
  rekapSekolah: AspekRekap[];
  rekapGuru: GuruRekap[];
  aspekSekolah: string[];
  aspekGuru: string[];
}

function RatingBar({ nilai, max = 5 }: { nilai: number; max?: number }) {
  const pct = (nilai / max) * 100;
  const color = nilai >= 4 ? "bg-emerald-500" : nilai >= 3 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-zinc-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-bold text-zinc-700 w-8 text-right">{nilai.toFixed(1)}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={12}
            className={nilai >= s ? "text-yellow-400 fill-yellow-400" : "text-zinc-200"}
          />
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function AdminEvaluationRecap() {
  const router = useRouter();
  const { periodeId } = router.query;

  const [data, setData] = useState<RekapData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"sekolah" | "guru">("sekolah");
  const [selectedGuru, setSelectedGuru] = useState<number | null>(null);

  useEffect(() => {
    if (!periodeId) return;
    setIsLoading(true);
    fetch(`/api/admin/evaluation-recap?periodeId=${periodeId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setData(d);
          if (d.rekapGuru?.length > 0) {
            setSelectedGuru(d.rekapGuru[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [periodeId]);

  const selectedGuruData = data?.rekapGuru.find((g) => g.id === selectedGuru);

  return (
    <Layout role="admin">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/evaluation")}
            className="text-zinc-400 hover:text-zinc-600 transition-colors p-1.5 rounded-lg hover:bg-zinc-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Rekap Hasil Evaluasi</h1>
            {data && (
              <p className="text-zinc-500 text-sm mt-0.5">
                {data.periode.tahunAjaran} &mdash; {formatDate(data.periode.mulai)} s/d {formatDate(data.periode.selesai)}
              </p>
            )}
          </div>
        </div>

        {data && (
          <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2">
            <Users size={16} className="text-violet-600" />
            <span className="text-sm font-semibold text-violet-700">
              {data.jumlahSubmit} Responden
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-32 gap-2 text-zinc-400">
          <Loader2 size={28} className="animate-spin text-blue-500" />
          <span className="text-sm">Memuat rekap evaluasi...</span>
        </div>
      ) : !data ? (
        <Card className="text-center py-16 text-zinc-400">
          <BarChart2 size={40} className="mx-auto mb-3 opacity-20" />
          <p>Data rekap tidak ditemukan.</p>
          <button
            onClick={() => router.push("/admin/evaluation")}
            className="mt-4 text-sm text-blue-600 hover:underline"
          >
            Kembali ke Manajemen Evaluasi
          </button>
        </Card>
      ) : (
        <>
          {/* Tab Switcher */}
          <div className="flex rounded-xl border border-zinc-200 overflow-hidden w-fit mb-6 shadow-sm">
            {(["sekolah", "guru"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-blue-500 text-white"
                    : "bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {tab === "sekolah" ? <School size={16} /> : <User size={16} />}
                Evaluasi {tab === "sekolah" ? "Sekolah" : "Guru"}
              </button>
            ))}
          </div>

          {/* ── Tab Sekolah ─────────────────────────────────────────────── */}
          {activeTab === "sekolah" && (
            <Card>
              <div className="flex items-center gap-2 mb-6">
                <School size={18} className="text-blue-600" />
                <h2 className="font-bold text-zinc-900">Hasil Evaluasi Sekolah</h2>
                <span className="ml-auto text-xs text-zinc-400">{data.jumlahSubmit} responden</span>
              </div>

              {data.rekapSekolah.every((r) => r.jumlah === 0) ? (
                <div className="text-center py-10 text-zinc-400">
                  <BarChart2 size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Belum ada data evaluasi sekolah untuk periode ini.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {data.rekapSekolah.map((r) => (
                    <div key={r.aspek}>
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-sm font-semibold text-zinc-700 truncate max-w-xs"
                          title={r.aspek}
                        >
                          {r.aspek}
                        </span>
                        <span className="text-xs text-zinc-400 shrink-0 ml-2">{r.jumlah} penilaian</span>
                      </div>
                      <RatingBar nilai={r.rata} />
                    </div>
                  ))}

                  {/* Rata-rata keseluruhan sekolah */}
                  {data.rekapSekolah.some((r) => r.jumlah > 0) && (
                    <div className="mt-6 pt-5 border-t border-zinc-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-zinc-900">Rata-rata Keseluruhan</span>
                      </div>
                      <RatingBar
                        nilai={parseFloat(
                          (
                            data.rekapSekolah.reduce((s, r) => s + r.rata, 0) /
                            data.rekapSekolah.filter((r) => r.jumlah > 0).length
                          ).toFixed(2)
                        )}
                      />
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* ── Tab Guru ────────────────────────────────────────────────── */}
          {activeTab === "guru" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Daftar Guru (sidebar) */}
              <Card className="lg:col-span-1 p-0 overflow-hidden">
                <div className="px-4 py-3 border-b border-zinc-100">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Pilih Guru</p>
                </div>
                {data.rekapGuru.length === 0 ? (
                  <div className="p-6 text-center text-zinc-400 text-sm">
                    Belum ada data evaluasi guru.
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {data.rekapGuru.map((g) => {
                      const isActive = selectedGuru === g.id;
                      const avg = g.rataKeseluruhan;
                      const color = avg >= 4 ? "text-emerald-600" : avg >= 3 ? "text-yellow-600" : "text-red-500";
                      return (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGuru(g.id)}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                            isActive ? "bg-blue-50" : "hover:bg-zinc-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className={`font-medium ${isActive ? "text-blue-600" : "text-zinc-700"}`}>
                              {g.nama}
                            </span>
                            <span className={`text-xs font-bold ${color}`}>{avg.toFixed(1)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Detail Rekap Guru */}
              <div className="lg:col-span-3">
                {selectedGuruData ? (
                  <Card>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {selectedGuruData.nama.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="font-bold text-zinc-900">{selectedGuruData.nama}</h2>
                        <p className="text-xs text-zinc-400">
                          Rata-rata keseluruhan:{" "}
                          <span className="font-semibold text-zinc-700">{selectedGuruData.rataKeseluruhan.toFixed(1)} / 5</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {selectedGuruData.rekap.map((r) => (
                        <div key={r.aspek}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-zinc-700">{r.aspek}</span>
                            <span className="text-xs text-zinc-400">{r.jumlah} penilaian</span>
                          </div>
                          <RatingBar nilai={r.rata} />
                        </div>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card className="text-center py-16 text-zinc-400">
                    <User size={32} className="mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Pilih guru untuk melihat rekap evaluasinya.</p>
                  </Card>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
