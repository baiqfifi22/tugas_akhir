import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileText, Calendar, Paperclip, CheckCircle2 } from "lucide-react";

export default function ParentPermission() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reasonType, setReasonType] = useState<"sakit" | "izin" | "">("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Hitung selisih hari
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
    return diffDays > 0 ? diffDays : 0;
  };

  const days = calculateDays();
  const needsDoctorNote = reasonType === "sakit" && days > 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reasonType || !description) return;
    if (needsDoctorNote && !file) return;

    // Simulasi pengiriman data
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setStartDate("");
      setEndDate("");
      setReasonType("");
      setDescription("");
      setFile(null);
    }, 3000);
  };

  const isFormValid =
    startDate &&
    endDate &&
    reasonType &&
    description &&
    (!needsDoctorNote || file) &&
    days > 0;

  return (
    <Layout role="parent">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Mengajukan Izin Sekolah</h1>
          <p className="text-zinc-500">Beritahu pihak sekolah jika anak Anda berhalangan hadir.</p>
        </div>
      </div>

      {isSubmitted && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="font-bold">Pengajuan Izin Berhasil Terkirim</p>
            <p className="text-emerald-600 font-normal">Wali kelas akan segera meninjau pengajuan izin ini.</p>
          </div>
        </div>
      )}

      <div className="max-w-2xl">
        <Card className="border-t-4 border-t-blue-500">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Tanggal Mulai */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              {/* Tanggal Selesai */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  Tanggal Selesai
                </label>
                <input
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
                Total durasi: <span className="text-blue-600 font-bold">{days} hari</span>
              </p>
            )}

            {/* Perihal */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <FileText size={14} className="inline mr-1" />
                Perihal
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${
                    reasonType === "sakit"
                      ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                      : "border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reasonType"
                    value="sakit"
                    checked={reasonType === "sakit"}
                    onChange={() => setReasonType("sakit")}
                    className="sr-only"
                  />
                  <span className="font-bold mb-1">Sakit</span>
                  <span className="text-xs text-center opacity-80">Memerlukan istirahat karena kondisi kesehatan.</span>
                </label>

                <label
                  className={`flex flex-col items-center justify-center p-4 border rounded-xl cursor-pointer transition-all ${
                    reasonType === "izin"
                      ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20"
                      : "border-zinc-200 hover:border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reasonType"
                    value="izin"
                    checked={reasonType === "izin"}
                    onChange={() => setReasonType("izin")}
                    className="sr-only"
                  />
                  <span className="font-bold mb-1">Izin</span>
                  <span className="text-xs text-center opacity-80">Keperluan keluarga atau hal penting lainnya.</span>
                </label>
              </div>
            </div>

            {/* Surat Dokter (Kondisional) */}
            {needsDoctorNote && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl animate-in fade-in zoom-in-95">
                <label className="block text-sm font-bold text-yellow-800 mb-2">
                  <Paperclip size={14} className="inline mr-1" />
                  Unggah Foto Surat Dokter
                </label>
                <p className="text-xs text-yellow-700 mb-3">
                  Karena izin sakit lebih dari 3 hari, Anda diwajibkan melampirkan foto surat keterangan dari dokter.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-sm text-zinc-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-yellow-100 file:text-yellow-700
                    hover:file:bg-yellow-200 transition-colors"
                  required
                />
              </div>
            )}

            {/* Keterangan */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <FileText size={14} className="inline mr-1" />
                Keterangan Detail
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tuliskan keterangan detail mengenai izin ini..."
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                required
              />
            </div>

            <div className="pt-4 border-t border-zinc-100 flex justify-end">
              <Button type="submit" variant="primary" disabled={!isFormValid || days < 1}>
                Kirim Pengajuan Izin
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
