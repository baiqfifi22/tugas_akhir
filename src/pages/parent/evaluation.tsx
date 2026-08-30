import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  CalendarX,
  AlertTriangle,
  School,
  UserCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ORANG_TUA"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

// ── Types ──────────────────────────────────────────────────────────────────────

type EvalStatus = "loading" | "BELUM_BUKA" | "AKTIF" | "SUDAH_SUBMIT" | "SELESAI";

interface AspekItem {
  id: number;
  teks: string;
}

interface Guru {
  id: number;
  nama: string;
  mataPelajaran: string;
  role?: string;
}

interface Periode {
  id: number;
  mulai: string;
  selesai: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── Laporan Personal Card (shortcut) ───────────────────────────────────────────

function LaporanPersonalCard() {
  return (
    <Link href="/parent/laporan-personal">
      <Card
        interactive
        className="group flex items-center gap-4 p-5 border-l-4 border-l-violet-400 hover:border-l-violet-600 hover:shadow-md transition-all cursor-pointer"
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center shrink-0 group-hover:bg-violet-200 transition-colors">
          <MessageSquare size={22} className="text-violet-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-zinc-900 text-sm">Laporan Personal ke Guru</p>
          <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
            Sampaikan pesan atau masukan personal kepada guru tertentu secara langsung.
            Tersedia kapan saja, tidak tergantung periode evaluasi.
          </p>
        </div>
        <ArrowRight
          size={18}
          className="text-violet-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all shrink-0"
        />
      </Card>
    </Link>
  );
}

// ── Likert Table ───────────────────────────────────────────────────────────────

function LikertTable({
  title,
  pertanyaan,
  prefix,
  scores,
  onScore,
  disabled,
}: {
  title: string;
  pertanyaan: AspekItem[];
  prefix: string;
  scores: Record<string, number>;
  onScore: (key: string, val: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-zinc-700 w-full border-b-2 border-zinc-200">
                {title}
              </th>
              <th
                colSpan={5}
                className="py-3 px-2 text-center border-b-2 border-zinc-200 min-w-[280px]"
              >
                <span className="text-xs font-semibold text-zinc-500 block mb-1">
                  Rentang Penilaian
                </span>
                <div className="flex justify-between items-center px-3">
                  <span className="text-xs text-zinc-400">Rendah</span>
                  <span className="text-xs text-zinc-400">Tinggi</span>
                </div>
              </th>
            </tr>
            <tr className="bg-orange-50/40">
              <th className="py-2 px-4 text-left text-xs font-medium text-zinc-400 border-b border-zinc-200">
                Pernyataan
              </th>
              {[1, 2, 3, 4, 5].map((n) => (
                <th
                  key={n}
                  className="py-2 px-0 text-center text-xs font-bold text-zinc-600 border-b border-zinc-200 w-14"
                >
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {pertanyaan.map((item) => {
              const key = `${prefix}_${item.id}`;
              const selected = scores[key] || 0;
              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${disabled ? "" : "hover:bg-orange-50/30"}`}
                >
                  <td className="py-4 px-4 text-zinc-700 leading-relaxed">{item.teks}</td>
                  {[1, 2, 3, 4, 5].map((val) => {
                    const isSelected = selected === val;
                    return (
                      <td key={val} className="py-4 px-0 text-center">
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => !disabled && onScore(key, val)}
                          className={`
                            w-9 h-9 rounded-full border-2 transition-all duration-150 mx-auto flex items-center justify-center
                            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400
                            ${disabled ? "cursor-default" : "cursor-pointer hover:border-orange-400 hover:bg-orange-50"}
                            ${
                              isSelected
                                ? disabled
                                  ? "bg-zinc-400 border-zinc-400"
                                  : "bg-orange-500 border-orange-500 shadow-md shadow-orange-200"
                                : "border-zinc-300 bg-white"
                            }
                          `}
                          aria-label={`Nilai ${val} untuk: ${item.teks}`}
                        >
                          {isSelected && (
                            <span className="w-2.5 h-2.5 rounded-full bg-white block" />
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="block sm:hidden space-y-4">
        <div className="bg-orange-50 border border-orange-100 p-3 rounded-xl mb-3 flex items-center justify-between text-xs text-orange-700 font-semibold">
          <span>Skor 1 (Sangat Rendah)</span>
          <span>➜</span>
          <span>Skor 5 (Sangat Tinggi)</span>
        </div>
        {pertanyaan.map((item) => {
          const key = `${prefix}_${item.id}`;
          const selected = scores[key] || 0;
          return (
            <div
              key={item.id}
              className="p-4 bg-white border border-zinc-100 rounded-xl shadow-sm"
            >
              <p className="text-sm text-zinc-800 leading-relaxed font-medium mb-4">
                {item.teks}
              </p>
              <div className="flex justify-between items-center gap-2 max-w-xs mx-auto">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = selected === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && onScore(key, val)}
                      className={`
                        w-10 h-10 rounded-full border-2 transition-all duration-150 flex items-center justify-center text-xs font-bold
                        ${disabled ? "cursor-default text-zinc-400" : "cursor-pointer hover:border-orange-400 hover:bg-orange-50"}
                        ${
                          isSelected
                            ? disabled
                              ? "bg-zinc-400 border-zinc-400 text-white"
                              : "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200"
                            : "border-zinc-300 bg-white text-zinc-700"
                        }
                      `}
                      aria-label={`Nilai ${val} untuk: ${item.teks}`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ParentEvaluation() {
  const [status, setStatus] = useState<EvalStatus>("loading");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [guruMapelList, setGuruMapelList] = useState<Guru[]>([]);
  const [aspekSekolah, setAspekSekolah] = useState<AspekItem[]>([]);
  const [aspekGuru, setAspekGuru] = useState<AspekItem[]>([]);
  const [message, setMessage] = useState("");
  const [kritikGuruMapel, setKritikGuruMapel] = useState<Record<number, string>>({});
  const [mapelScores, setMapelScores] = useState<Record<string, number>>({});

  const [activeTab, setActiveTab] = useState<"sekolah" | "guru" | "mapel">("sekolah");
  const [scores, setScores] = useState<Record<string, number>>({});
  const [saranSekolah, setSaranSekolah] = useState("");
  const [kritikGuru, setKritikGuru] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetch("/api/parent/evaluation")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStatus(d.status as EvalStatus);
          if (d.periode) setPeriode(d.periode);
          if (d.guruList) setGuruList(d.guruList);
          if (d.guruMapelList) setGuruMapelList(d.guruMapelList);
          if (d.aspekSekolah) setAspekSekolah(d.aspekSekolah);
          if (d.aspekGuru) setAspekGuru(d.aspekGuru);
          if (d.message) setMessage(d.message);

          if (d.status === "SUDAH_SUBMIT" && d.periode?.id) {
            try {
              const saved = localStorage.getItem(`eval_submit_${d.periode.id}`);
              if (saved) {
                const parsed = JSON.parse(saved);
                setScores(parsed.scores || {});
                setSaranSekolah(parsed.saranSekolah || "");
                setKritikGuru(parsed.kritikGuru || {});
              }
            } catch {
              // abaikan
            }
          }
        }
      })
      .catch(() => setStatus("BELUM_BUKA"));
  }, []);

  const handleScore = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const getMissingField = (): { tab: "sekolah" | "guru"; msg: string } | null => {
    if (aspekSekolah.some((a) => (scores[`sekolah_${a.id}`] || 0) === 0))
      return { tab: "sekolah", msg: "Harap isi semua poin penilaian di bagian Evaluasi Sekolah." };
    if (!saranSekolah.trim())
      return { tab: "sekolah", msg: "Harap isi kolom Kesan & Pesan untuk Sekolah." };
    for (const g of guruList) {
      if (aspekGuru.some((a) => (scores[`guru_${g.id}_${a.id}`] || 0) === 0))
        return { tab: "guru", msg: `Harap isi semua poin penilaian untuk ${g.nama}.` };
      if (!(kritikGuru[g.id] || "").trim())
        return { tab: "guru", msg: `Harap isi kolom Kritik / Pesan untuk ${g.nama}.` };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const missing = getMissingField();
    if (missing) {
      setActiveTab(missing.tab);
      setSubmitError(missing.msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const evaluasiSekolah = aspekSekolah.map((a) => ({
        aspekId: a.id,
        skor: scores[`sekolah_${a.id}`],
      }));

      const evaluasiGuru = guruList.map((g) => ({
        guruId: g.id,
        aspekList: aspekGuru.map((a) => ({
          aspekId: a.id,
          skor: scores[`guru_${g.id}_${a.id}`],
        })),
      }));

      const kritikGuruPayload: Record<string, string> = {};
      Object.entries(kritikGuru).forEach(([k, v]) => {
        kritikGuruPayload[k] = (v as string).trim();
      });

      const evaluasiGuruMapelPayload = guruMapelList
        .map((g) => ({
          guruId: g.id,
          aspekList: aspekGuru
            .filter((a) => (mapelScores[`mapel_${g.id}_${a.id}`] || 0) > 0)
            .map((a) => ({ aspekId: a.id, skor: mapelScores[`mapel_${g.id}_${a.id}`] })),
          kritik: (kritikGuruMapel[g.id] || "").trim(),
        }))
        .filter((g) => g.aspekList.length > 0);

      const res = await fetch("/api/parent/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodeId: periode?.id,
          evaluasiSekolah,
          evaluasiGuru,
          saranSekolah: saranSekolah.trim(),
          kritikGuru: kritikGuruPayload,
          evaluasiGuruMapel: evaluasiGuruMapelPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || "Gagal mengirim evaluasi");
        return;
      }

      if (periode?.id) {
        try {
          localStorage.setItem(
            `eval_submit_${periode.id}`,
            JSON.stringify({ scores, saranSekolah: saranSekolah.trim(), kritikGuru })
          );
        } catch {
          // abaikan
        }
      }

      setJustSubmitted(true);
      setStatus("SUDAH_SUBMIT");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("Gagal menghubungi server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <Layout role="parent">
        <div className="flex items-center justify-center py-32 gap-2 text-zinc-400">
          <Loader2 size={28} className="animate-spin text-orange-500" />
          <span className="text-sm">Memuat data evaluasi...</span>
        </div>
      </Layout>
    );
  }

  // ── Belum Buka ───────────────────────────────────────────────────────────────
  if (status === "BELUM_BUKA") {
    return (
      <Layout role="parent">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Evaluasi Sekolah dan Wali Kelas</h1>
        </div>
        <Card className="max-w-lg mx-auto text-center py-14 border-t-4 border-t-orange-400 mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-orange-500" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800 mb-2">Belum Waktunya Mengisi Evaluasi</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            {message || "Periode evaluasi belum dibuka. Silakan cek kembali nanti."}
          </p>
          {periode && (
            <div className="mt-5 inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 text-sm text-orange-700">
              <CalendarX size={15} />
              Mulai: {formatDate(periode.mulai)}
            </div>
          )}
        </Card>
        <LaporanPersonalCard />
      </Layout>
    );
  }

  // ── Selesai ──────────────────────────────────────────────────────────────────
  if (status === "SELESAI") {
    return (
      <Layout role="parent">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Evaluasi Sekolah dan Wali Kelas</h1>
        </div>
        <Card className="max-w-lg mx-auto text-center py-14 border-t-4 border-t-zinc-300 mb-6">
          <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto mb-4">
            <CalendarX size={28} className="text-zinc-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800 mb-2">Periode Evaluasi Sudah Selesai</h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Periode evaluasi telah ditutup. Terima kasih atas partisipasi Anda.
          </p>
        </Card>
        <LaporanPersonalCard />
      </Layout>
    );
  }

  // ── Baru Submit — Success State ───────────────────────────────────────────────
  if (status === "SUDAH_SUBMIT" && justSubmitted) {
    return (
      <Layout role="parent">
        <div className="flex items-center justify-center min-h-[50vh] py-12">
          <Card className="max-w-md w-full text-center py-16 px-8 border-t-4 border-t-orange-400 shadow-lg">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-3">Berhasil Mengirim Hasil Survey</h2>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-xs mx-auto">
              Terima kasih atas partisipasi Anda! Masukan Anda sangat berarti bagi pengembangan
              sekolah dan wali kelas kami.
            </p>
            {periode && (
              <p className="mt-5 text-xs text-zinc-400">
                Periode berakhir: {formatDate(periode.selesai)}
              </p>
            )}
          </Card>
        </div>
        <div className="mt-2">
          <LaporanPersonalCard />
        </div>
      </Layout>
    );
  }

  // ── SUDAH_SUBMIT (revisit) & AKTIF — Form ─────────────────────────────────────
  const isDisabled = status === "SUDAH_SUBMIT";
  const hasRestoredData = Object.keys(scores).length > 0;

  return (
    <Layout role="parent">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Evaluasi Sekolah dan Wali Kelas</h1>
        {periode && (
          <p className="text-zinc-500 text-sm mt-1">
            Periode evaluasi:{" "}
            <span className="font-medium text-zinc-700">
              {formatDate(periode.mulai)} – {formatDate(periode.selesai)}
            </span>
          </p>
        )}
      </div>

      {/* Shortcut Laporan Personal */}
      <div className="mb-6">
        <LaporanPersonalCard />
      </div>

      {/* Banner: Sudah Submit */}
      {isDisabled && (
        <div className="mb-6 flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-800 px-5 py-4 rounded-xl shadow-sm">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="font-bold text-sm">Pengisian Sudah Dilakukan</p>
            <p className="text-xs text-orange-600 mt-0.5">
              Jawaban Anda telah tersimpan. Tidak dapat mengubah jawaban.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {submitError && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          {submitError}
        </div>
      )}

      {/* Sudah submit tapi tidak ada data */}
      {isDisabled && !hasRestoredData ? (
        <Card className="text-center py-12 border-t-4 border-t-orange-300">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-orange-400" />
          <p className="font-medium text-zinc-700">Anda telah mengisi evaluasi untuk periode ini.</p>
          <p className="text-sm text-zinc-400 mt-1">
            Jawaban tidak dapat ditampilkan kembali dari perangkat ini.
          </p>
        </Card>
      ) : (
        <>
          {/* Tab Switcher */}
          <div className="flex gap-1.5 p-1.5 bg-orange-50 border border-orange-100 rounded-2xl mb-6 shadow-sm">
            {(
              [
                { key: "sekolah", label: "Evaluasi Sekolah", icon: School },
                { key: "guru", label: "Evaluasi Wali Kelas", icon: UserCheck },
                ...(guruMapelList.length > 0
                  ? [{ key: "mapel" as const, label: "Guru Mapel", icon: UserCheck }]
                  : []),
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!isDisabled) {
                    setActiveTab(key);
                    setSubmitError("");
                  }
                }}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200
                  ${
                    activeTab === key
                      ? "bg-orange-500 text-white shadow-md shadow-orange-200"
                      : isDisabled
                      ? "text-zinc-400 cursor-default"
                      : "text-orange-700 hover:bg-orange-100 cursor-pointer"
                  }
                `}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 pb-10">
            {/* ── Tab: Evaluasi Sekolah ────────────────────────────────────── */}
            {activeTab === "sekolah" && aspekSekolah.length > 0 && (
              <Card className="p-0 overflow-hidden border-t-4 border-t-orange-400">
                <div className="px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
                  <div className="flex items-center gap-2">
                    <School size={18} className="text-orange-500" />
                    <h2 className="text-base font-bold text-zinc-900">Penilaian Sekolah</h2>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Berikan penilaian 1 (rendah) hingga 5 (tinggi) untuk setiap pernyataan.
                  </p>
                </div>
                <div className="p-6">
                  <LikertTable
                    title="Pernyataan tentang sekolah"
                    pertanyaan={aspekSekolah}
                    prefix="sekolah"
                    scores={scores}
                    onScore={handleScore}
                    disabled={isDisabled}
                  />
                  <div className="mt-8 pt-6 border-t border-orange-100">
                    <label className="block text-sm font-semibold text-zinc-700 mb-1">
                      Kesan &amp; Pesan{" "}
                      {!isDisabled && <span className="text-red-500 font-bold">*</span>}
                    </label>
                    <p className="text-xs text-zinc-400 mb-3">
                      Tuliskan kesan, pesan, atau masukan Anda untuk sekolah secara umum.
                    </p>
                    <textarea
                      rows={4}
                      value={saranSekolah}
                      onChange={(e) => setSaranSekolah(e.target.value)}
                      disabled={isDisabled}
                      placeholder="Tuliskan kesan dan pesan Anda untuk sekolah..."
                      className={`w-full border rounded-xl px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-colors resize-none ${
                        isDisabled
                          ? "bg-zinc-50 border-zinc-200 text-zinc-500 cursor-default"
                          : "bg-orange-50/40 border-orange-200 focus:bg-white"
                      }`}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* ── Tab: Evaluasi Wali Kelas ─────────────────────────────────── */}
            {activeTab === "guru" &&
              guruList.map((guru) => (
                <Card key={guru.id} className="p-0 overflow-hidden border-t-4 border-t-orange-400">
                  <div className="px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
                    <div className="flex items-center gap-2">
                      <UserCheck size={18} className="text-orange-500" />
                      <h2 className="text-base font-bold text-zinc-900">
                        Penilaian Wali Kelas — {guru.nama}
                      </h2>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">Wali Kelas</p>
                  </div>
                  <div className="p-6">
                    <LikertTable
                      title={`Pernyataan tentang ${guru.nama}`}
                      pertanyaan={aspekGuru}
                      prefix={`guru_${guru.id}`}
                      scores={scores}
                      onScore={handleScore}
                      disabled={isDisabled}
                    />
                    <div className="mt-8 pt-6 border-t border-orange-100">
                      <label className="block text-sm font-semibold text-zinc-700 mb-1">
                        Kritik / Pesan untuk {guru.nama}{" "}
                        {!isDisabled && <span className="text-red-500 font-bold">*</span>}
                      </label>
                      <p className="text-xs text-zinc-400 mb-3">
                        Sampaikan kritik atau pesan membangun untuk wali kelas.
                      </p>
                      <textarea
                        rows={4}
                        value={kritikGuru[guru.id] || ""}
                        onChange={(e) =>
                          setKritikGuru((prev) => ({ ...prev, [guru.id]: e.target.value }))
                        }
                        disabled={isDisabled}
                        placeholder={`Tuliskan kritik atau pesan untuk ${guru.nama}...`}
                        className={`w-full border rounded-xl px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-colors resize-none ${
                          isDisabled
                            ? "bg-zinc-50 border-zinc-200 text-zinc-500 cursor-default"
                            : "bg-orange-50/40 border-orange-200 focus:bg-white"
                        }`}
                      />
                    </div>
                  </div>
                </Card>
              ))}

            {activeTab === "guru" && guruList.length === 0 && (
              <Card className="text-center py-12 border-t-4 border-t-orange-200">
                <UserCheck size={28} className="mx-auto mb-3 text-orange-300" />
                <p className="text-sm text-zinc-500">
                  Data wali kelas belum tersedia untuk anak Anda pada tahun ajaran ini.
                </p>
              </Card>
            )}

            {/* ── Tab: Evaluasi Guru Mapel (Opsional) ─────────────────── */}
            {activeTab === "mapel" && guruMapelList.length > 0 && (
              <>
                <div className="mb-4 flex items-center gap-2 px-1">
                  <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-bold border border-orange-200">
                    Opsional
                  </span>
                  <p className="text-sm text-zinc-500">
                    Evaluasi guru mapel bersifat opsional. Anda dapat mengosongkan bagian ini.
                  </p>
                </div>
                {guruMapelList.map((guru) => (
                  <Card
                    key={guru.id}
                    className="p-0 overflow-hidden border-t-4 border-t-orange-300"
                  >
                    <div className="px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white">
                      <div className="flex items-center gap-2">
                        <UserCheck size={18} className="text-orange-400" />
                        <h2 className="text-base font-bold text-zinc-900">
                          Penilaian — {guru.nama}
                        </h2>
                        <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                          {guru.mataPelajaran.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">Guru Mata Pelajaran · Opsional</p>
                    </div>
                    <div className="p-6">
                      <LikertTable
                        title={`Pernyataan tentang ${guru.nama}`}
                        pertanyaan={aspekGuru}
                        prefix={`mapel_${guru.id}`}
                        scores={mapelScores}
                        onScore={(key, val) =>
                          setMapelScores((prev) => ({ ...prev, [key]: val }))
                        }
                        disabled={isDisabled}
                      />
                      <div className="mt-6 pt-4 border-t border-orange-100">
                        <label className="block text-sm font-semibold text-zinc-700 mb-1">
                          Kritik / Pesan untuk {guru.nama}
                          <span className="ml-2 text-xs font-normal text-zinc-400">(opsional)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={kritikGuruMapel[guru.id] || ""}
                          onChange={(e) =>
                            setKritikGuruMapel((prev) => ({ ...prev, [guru.id]: e.target.value }))
                          }
                          disabled={isDisabled}
                          placeholder={`Tuliskan kritik atau pesan untuk ${guru.nama}... (opsional)`}
                          className={`w-full border rounded-xl px-4 py-3 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-colors resize-none ${
                            isDisabled
                              ? "bg-zinc-50 border-zinc-200 text-zinc-500 cursor-default"
                              : "bg-orange-50/40 border-orange-200 focus:bg-white"
                          }`}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}

            {/* ── Tombol Kirim ─────────────────────────────────────────────── */}
            {!isDisabled && (
              <div className="flex justify-center pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-10 py-3.5 rounded-xl transition-all font-bold text-sm shadow-lg shadow-orange-200 disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  {submitting ? "Mengirim..." : "Kirim Evaluasi"}
                </button>
              </div>
            )}
          </form>
        </>
      )}
    </Layout>
  );
}
