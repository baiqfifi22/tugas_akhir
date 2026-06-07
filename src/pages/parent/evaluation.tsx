import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  CalendarX,
  AlertTriangle,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ORANG_TUA"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

// ── Types ─────────────────────────────────────────────────────────────────────

type EvalStatus =
  | "loading"
  | "BELUM_BUKA"
  | "AKTIF"
  | "SUDAH_SUBMIT"
  | "SELESAI";

interface AspekItem {
  id: number;
  teks: string;
}

interface Guru {
  id: number;
  nama: string;
  mataPelajaran: string;
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

// ── Komponen Tabel Penilaian (Likert Scale) ───────────────────────────────────

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
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 font-semibold text-zinc-700 w-full border-b-2 border-zinc-200">
              Pertanyaan
            </th>
            <th
              colSpan={5}
              className="py-3 px-2 text-center border-b-2 border-zinc-200 min-w-70"
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
          <tr className="bg-zinc-50">
            <th className="py-2 px-4 text-left text-xs font-medium text-zinc-400 border-b border-zinc-200">
              {title}
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
            // Key pakai aspekId agar bisa dipetakan saat submit
            const key = `${prefix}_${item.id}`;
            const selected = scores[key] || 0;
            return (
              <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
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
                          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
                          ${disabled ? "cursor-default" : "cursor-pointer hover:border-blue-400 hover:bg-blue-50"}
                          ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-200"
                              : "border-zinc-300 bg-white"
                          }
                        `}
                        aria-label={`Nilai ${val} untuk pertanyaan: ${item.teks}`}
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
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ParentEvaluation() {
  const [status, setStatus] = useState<EvalStatus>("loading");
  const [periode, setPeriode] = useState<Periode | null>(null);
  const [guruList, setGuruList] = useState<Guru[]>([]);
  const [aspekSekolah, setAspekSekolah] = useState<AspekItem[]>([]);
  const [aspekGuru, setAspekGuru] = useState<AspekItem[]>([]);
  const [message, setMessage] = useState("");

  const [scores, setScores] = useState<Record<string, number>>({});
  const [saran, setSaran] = useState("");
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
          if (d.aspekSekolah) setAspekSekolah(d.aspekSekolah);
          if (d.aspekGuru) setAspekGuru(d.aspekGuru);
          if (d.message) setMessage(d.message);
        }
      })
      .catch(() => setStatus("BELUM_BUKA"));
  }, []);

  const handleScore = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  // Validasi: semua pertanyaan harus diisi
  const allFilled = () => {
    const sekolahOk = aspekSekolah.every(
      (a) => (scores[`sekolah_${a.id}`] || 0) > 0
    );
    const guruOk = guruList.every((g) =>
      aspekGuru.every((a) => (scores[`guru_${g.id}_${a.id}`] || 0) > 0)
    );
    return sekolahOk && guruOk;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!allFilled()) {
      setSubmitError(
        "Mohon isi semua penilaian (pilih angka 1–5) sebelum mengirim."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      // Build payload evaluasi sekolah — kirim aspekId (Int FK)
      const evaluasiSekolah = aspekSekolah.map((a) => ({
        aspekId: a.id,
        skor: scores[`sekolah_${a.id}`],
        kritik: null,
      }));

      // Build payload evaluasi guru — kirim aspekId (Int FK)
      const evaluasiGuru = guruList.map((g) => ({
        guruId: g.id,
        aspekList: aspekGuru.map((a) => ({
          aspekId: a.id,
          skor: scores[`guru_${g.id}_${a.id}`],
          kritik: null,
        })),
      }));

      const res = await fetch("/api/parent/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodeId: periode?.id,
          evaluasiSekolah,
          evaluasiGuru,
          saran: saran.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.message || "Gagal mengirim evaluasi");
        return;
      }

      setStatus("SUDAH_SUBMIT");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setSubmitError("Gagal menghubungi server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── State: Loading ────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <Layout role="parent">
        <div className="flex items-center justify-center py-32 gap-2 text-zinc-400">
          <Loader2 size={28} className="animate-spin text-blue-500" />
          <span className="text-sm">Memuat data evaluasi...</span>
        </div>
      </Layout>
    );
  }

  // ── State: Belum Buka ─────────────────────────────────────────────────────
  if (status === "BELUM_BUKA") {
    return (
      <Layout role="parent">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">
            Evaluasi Sekolah dan Guru
          </h1>
        </div>
        <Card className="max-w-lg mx-auto text-center py-14">
          <div className="w-16 h-16 rounded-full bg-yellow-50 border border-yellow-200 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-yellow-500" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800 mb-2">
            Belum Waktunya Mengisi Evaluasi
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            {message || "Periode evaluasi belum dibuka. Silakan cek kembali nanti."}
          </p>
          {periode && (
            <div className="mt-5 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm text-yellow-700">
              <CalendarX size={15} />
              Mulai: {formatDate(periode.mulai)}
            </div>
          )}
        </Card>
      </Layout>
    );
  }

  // ── State: Sudah Submit ───────────────────────────────────────────────────
  if (status === "SUDAH_SUBMIT") {
    return (
      <Layout role="parent">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">
            Evaluasi Sekolah dan Guru
          </h1>
        </div>
        <Card className="max-w-lg mx-auto text-center py-14">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald-500" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800 mb-2">
            Evaluasi Sudah Dikirim
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Terima kasih! Masukan Anda sangat berarti bagi pengembangan sekolah
            dan para guru kami.
          </p>
          {periode && (
            <p className="mt-4 text-xs text-zinc-400">
              Periode berakhir: {formatDate(periode.selesai)}
            </p>
          )}
        </Card>
      </Layout>
    );
  }

  // ── State: Selesai ────────────────────────────────────────────────────────
  if (status === "SELESAI") {
    return (
      <Layout role="parent">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">
            Evaluasi Sekolah dan Guru
          </h1>
        </div>
        <Card className="max-w-lg mx-auto text-center py-14">
          <div className="w-16 h-16 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto mb-4">
            <CalendarX size={28} className="text-zinc-400" />
          </div>
          <h2 className="text-lg font-bold text-zinc-800 mb-2">
            Periode Evaluasi Sudah Selesai
          </h2>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Periode evaluasi telah ditutup. Terima kasih atas partisipasi Anda.
          </p>
        </Card>
      </Layout>
    );
  }

  // ── State: AKTIF — Form Evaluasi ──────────────────────────────────────────
  return (
    <Layout role="parent">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          Evaluasi Sekolah dan Guru
        </h1>
        {periode && (
          <p className="text-zinc-500 text-sm mt-1">
            Periode evaluasi:{" "}
            <span className="font-medium text-zinc-700">
              {formatDate(periode.mulai)} – {formatDate(periode.selesai)}
            </span>
          </p>
        )}
      </div>

      {submitError && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle size={16} className="shrink-0" />
          {submitError}
        </div>
      )}

      {aspekSekolah.length === 0 && aspekGuru.length === 0 ? (
        <Card className="text-center py-14 text-zinc-400">
          <AlertTriangle size={32} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-zinc-500">Belum ada pertanyaan evaluasi</p>
          <p className="text-sm mt-1">Admin belum menambahkan pertanyaan evaluasi.</p>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 pb-10">
          {/* ── Tabel Evaluasi Sekolah ───────────────────────────────────── */}
          {aspekSekolah.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
                <h2 className="text-base font-bold text-zinc-900">Evaluasi Sekolah</h2>
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
                />
              </div>
            </Card>
          )}

          {/* ── Tabel Evaluasi per Guru ──────────────────────────────────── */}
          {aspekGuru.length > 0 &&
            guruList.map((guru) => (
              <Card key={guru.id} className="p-0 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
                  <h2 className="text-base font-bold text-zinc-900">
                    Evaluasi Guru — {guru.nama}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {guru.mataPelajaran.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="p-6">
                  <LikertTable
                    title={`Pernyataan tentang ${guru.nama}`}
                    pertanyaan={aspekGuru}
                    prefix={`guru_${guru.id}`}
                    scores={scores}
                    onScore={handleScore}
                  />
                </div>
              </Card>
            ))}

          {/* ── Saran / Komentar Umum ───────────────────────────────────── */}
          <Card>
            <label className="block text-sm font-semibold text-zinc-700 mb-2">
              Saran &amp; Masukan{" "}
              <span className="text-zinc-400 font-normal">(opsional)</span>
            </label>
            <textarea
              rows={4}
              value={saran}
              onChange={(e) => setSaran(e.target.value)}
              placeholder="Tuliskan saran, kritik, atau masukan membangun untuk sekolah dan guru..."
              className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-700 bg-zinc-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
            />
          </Card>

          {/* ── Tombol Kirim ────────────────────────────────────────────── */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-900 text-white px-10 py-3 rounded-xl transition font-semibold text-sm shadow-md disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              {submitting ? "Mengirim..." : "Kirim"}
            </button>
          </div>
        </form>
      )}
    </Layout>
  );
}
