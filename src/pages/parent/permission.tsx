import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FileText,
  Calendar,
  Paperclip,
  CheckCircle2,
  ImageIcon,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ORANG_TUA"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

export default function ParentPermission() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reasonType, setReasonType] = useState<"sakit" | "izin" | "">("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [limitInfo, setLimitInfo] = useState<{ totalIzinAlpa: number; maxIzinAlpa: number } | null>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/parent/permission");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setHistory(data.history || []);
          if (data.limitInfo) setLimitInfo(data.limitInfo);
        }
      }
    } catch (err) {
      console.error("Failed to fetch permission history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    async function ambilHistory() {
      await fetchHistory();
    }
    ambilHistory();
  }, []);

  // Hitung selisih hari
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const days = calculateDays();
  const needsDoctorNote = reasonType === "sakit" && days > 3;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(selected);
    } else {
      setFilePreview("");
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reasonType || !description) return;
    if (needsDoctorNote && !file) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Convert foto ke base64 jika ada
      let fotoBase64 = "";
      if (file) {
        fotoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch("/api/parent/permission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          reasonType,
          description,
          foto: fotoBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengirim pengajuan");
      }

      setIsSubmitted(true);
      fetchHistory();
      // Reset form after 4s
      setTimeout(() => {
        setIsSubmitted(false);
        setStartDate("");
        setEndDate("");
        setReasonType("");
        setDescription("");
        setFile(null);
        setFilePreview("");
      }, 4000);
    } catch (err: any) {
      setSubmitError(err.message || "Terjadi kesalahan. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    startDate &&
    endDate &&
    reasonType &&
    description.trim() &&
    (!needsDoctorNote || file) &&
    days > 0;

  return (
    <Layout role="parent">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Mengajukan Izin Sekolah
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Beritahu pihak sekolah jika anak Anda berhalangan hadir.
          </p>
        </div>
      </div>

      {/* Notifikasi Batas Kehadiran (Izin & Alpa) */}
      {limitInfo && limitInfo.totalIzinAlpa > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {(() => {
            const used = limitInfo.totalIzinAlpa;
            const max = limitInfo.maxIzinAlpa;
            const remaining = Math.max(0, max - used);
            const isDanger = used >= max;
            const isWarning = used >= 7 && !isDanger;
            return (
              <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
                isDanger ? "bg-red-50 border-red-200 text-red-800" :
                isWarning ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
                "bg-blue-50 border-blue-200 text-blue-800"
              }`}>
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm">Batas Ketidakhadiran (Izin &amp; Alpa): {used} dari {max} hari terpakai</p>
                  {remaining > 0 ? (
                    <p className="text-xs mt-0.5 font-normal">Sisa {remaining} hari lagi sebelum batas maksimal ketidakhadiran</p>
                  ) : (
                    <p className="text-xs mt-0.5 font-semibold">Batas maksimal ketidakhadiran (Izin & Alpa) sudah tercapai!</p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Success Banner */}
      {isSubmitted && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl text-sm font-medium shadow-sm">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="font-bold">Pengajuan Izin Berhasil Tersimpan</p>
            <p className="text-emerald-600 font-normal">
              Data izin telah disimpan. Wali kelas akan segera meninjau.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {submitError && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl text-sm font-medium">
          <AlertCircle size={20} className="shrink-0" />
          {submitError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-7">
          <Card className="border-t-4 border-t-blue-500">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tanggal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Tanggal Mulai
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <Calendar size={14} className="inline mr-1" />
                    Tanggal Selesai
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
              </div>

              {days > 0 && (
                <p className="text-sm text-zinc-500 font-medium">
                  Total durasi:{" "}
                  <span className="text-blue-600 font-bold">{days} hari</span>
                </p>
              )}

              {/* Perihal */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <FileText size={14} className="inline mr-1" />
                  Perihal
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {(["sakit", "izin"] as const).map((type) => (
                    <label
                      key={type}
                      className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${
                        reasonType === type
                          ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                          : "border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="reasonType"
                        value={type}
                        checked={reasonType === type}
                        onChange={() => setReasonType(type)}
                        className="sr-only"
                      />
                      <span className="font-bold mb-1 capitalize">{type}</span>
                      <span className="text-xs text-center opacity-80">
                        {type === "sakit"
                          ? "Memerlukan istirahat karena kondisi kesehatan."
                          : "Keperluan keluarga atau hal penting lainnya."}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Surat Dokter — wajib jika sakit > 3 hari */}
              {needsDoctorNote && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <label className="block text-sm font-bold text-yellow-800 mb-1">
                    <Paperclip size={14} className="inline mr-1" />
                    Unggah Foto Surat Dokter{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <p className="text-xs text-yellow-700 mb-3">
                    Izin sakit lebih dari 3 hari wajib melampirkan foto surat
                    keterangan dokter.
                  </p>
                  <UploadArea
                    file={file}
                    preview={filePreview}
                    onChange={handleFileChange}
                    onRemove={removeFile}
                    required
                  />
                </div>
              )}

              {/* Foto opsional (selalu tampil) */}
              {!needsDoctorNote && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    <ImageIcon size={14} className="inline mr-1" />
                    Lampiran Foto{" "}
                    <span className="text-zinc-400 font-normal text-xs">
                      (opsional)
                    </span>
                  </label>
                  <UploadArea
                    file={file}
                    preview={filePreview}
                    onChange={handleFileChange}
                    onRemove={removeFile}
                    required={false}
                  />
                </div>
              )}

              {/* Keterangan Detail */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <FileText size={14} className="inline mr-1" />
                  Keterangan Detail
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan keterangan detail mengenai izin ini..."
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                  required
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <Button
                  id="btn-submit-izin"
                  type="submit"
                  variant="primary"
                  disabled={!isFormValid || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    "Kirim Pengajuan Izin"
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: History Sidebar */}
        <div className="lg:col-span-5">
          <Card className="border-t-4 border-t-emerald-500">
            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-emerald-600" />
              Riwayat Izin Anak
            </h2>

            {loadingHistory ? (
              <div className="flex items-center justify-center py-12 gap-2 text-zinc-400">
                <Loader2 size={24} className="animate-spin text-emerald-500" />
                <span className="text-sm">Memuat riwayat izin...</span>
              </div>
            ) : history.length === 0 ? (
              <p className="text-zinc-500 text-sm py-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                Belum ada riwayat pengajuan izin pada tahun ajaran ini.
              </p>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {history.map((h) => {
                  const formatD = (dStr: string) => {
                    return new Date(dStr).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    });
                  };
                  const daysDiff =
                    Math.ceil(
                      (new Date(h.selesai).getTime() -
                        new Date(h.mulai).getTime()) /
                        (1000 * 60 * 60 * 24),
                    ) + 1;

                  return (
                    <div
                      key={h.id}
                      className="p-4 rounded-xl border border-zinc-150 bg-white hover:shadow-md transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            h.status === "SAKIT"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-250"
                              : "bg-blue-50 text-blue-700 border border-blue-250"
                          }`}
                        >
                          {h.status}
                        </span>
                        <span className="text-xs text-zinc-400 font-medium">
                          {daysDiff} Hari
                        </span>
                      </div>
                      <p className="text-sm font-bold text-zinc-800 mb-1">
                        {formatD(h.mulai)} - {formatD(h.selesai)}
                      </p>
                      <p className="text-xs text-zinc-500 line-clamp-3">
                        {h.perihal}
                      </p>
                      {h.foto && (
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold bg-emerald-50 py-1 px-2.5 rounded-md w-fit">
                          <CheckCircle2 size={12} />
                          Lampiran Foto Ada
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}

// ── Sub-component: Upload Area ─────────────────────────────────────────────
function UploadArea({
  file,
  preview,
  onChange,
  onRemove,
  required,
}: {
  file: File | null;
  preview: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  required: boolean;
}) {
  if (file && preview) {
    return (
      <div className="relative inline-block">
        <img
          src={preview}
          alt="Preview"
          className="w-full max-w-xs rounded-xl border border-zinc-200 object-cover shadow-sm"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 w-7 h-7 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-600 hover:text-red-500 hover:border-red-300 shadow transition-colors"
        >
          <X size={14} />
        </button>
        <p className="text-xs text-zinc-400 mt-2">{file.name}</p>
      </div>
    );
  }

  return (
    <label className="flex flex-col items-center justify-center w-full max-w-xs h-32 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group">
      <ImageIcon
        size={28}
        className="text-zinc-300 group-hover:text-blue-400 mb-2 transition-colors"
      />
      <span className="text-xs text-zinc-400 group-hover:text-blue-500">
        Klik untuk unggah foto
      </span>
      <span className="text-xs text-zinc-300 mt-1">JPG, PNG, max 5MB</span>
      <input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="sr-only"
        required={required}
      />
    </label>
  );
}
