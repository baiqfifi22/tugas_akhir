import React, { useState, useEffect, useCallback } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import {
  Calendar,
  Save,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3,
  RefreshCw,
  X,
  ImageIcon,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["GURU", "KEPALA_SEKOLAH"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

interface Student {
  id: number;
  name: string;
  status: string;
}

type SaveState = "initial" | "saved" | "submitting" | "submitted";
type Mode = "new" | "edit";

// Helper hitung selisih hari
function calculateDaysDiff(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays > 0 ? diffDays : 0;
}

// Helper memformat tanggal Indonesia
function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ClassAttendance() {
  const router = useRouter();
  const { id } = router.query;

  const [isClient, setIsClient] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [kelasNama, setKelasNama] = useState("");
  const [date, setDate] = useState("");
  const [activity, setActivity] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("initial");

  // Mode: "new" = absensi baru, "edit" = update yang sudah ada
  const [mode, setMode] = useState<Mode>("new");
  const [existingSesiId, setExistingSesiId] = useState<number | null>(null);
  const [existingSummary, setExistingSummary] = useState<{
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    total: number;
  } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [activeIzins, setActiveIzins] = useState<any[]>([]);
  const [selectedIzin, setSelectedIzin] = useState<any | null>(null);

  // Load daftar siswa
  const fetchStudents = useCallback(async (kelasId: string) => {
    try {
      const res = await fetch(`/api/teacher/class/${kelasId}/students`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.kelasNama) setKelasNama(data.kelasNama);
          return data.students as Student[];
        }
      }
    } catch {
      /* silent */
    }
    return [];
  }, []);

  // Cek status absensi untuk tanggal yang dipilih
  const checkAttendanceStatus = useCallback(
    async (kelasId: string, tanggal: string) => {
      if (!kelasId || !tanggal) return;
      setCheckingStatus(true);
      setSaveState("initial");

      try {
        const res = await fetch(
          `/api/teacher/attendance/status?kelasId=${kelasId}&tanggal=${tanggal}`,
        );
        const data = await res.json();

        const izins = data.izins || [];
        setActiveIzins(izins);

        if (res.ok && data.sudahAbsen) {
          // Sudah ada absensi → mode edit, load data existing
          setMode("edit");
          setExistingSesiId(data.sesiId);
          setExistingSummary(data.summary);
          setActivity(data.notes || "");

          // Merge status existing ke daftar siswa
          const baseStudents = await fetchStudents(kelasId);
          const mergedStudents = baseStudents.map((s: Student) => {
            const found = data.absensi.find((a: Student) => a.id === s.id);
            return found ? { ...s, status: found.status } : s;
          });
          setStudents(mergedStudents);
          setSaveState("submitted");
        } else {
          // Belum ada absensi → mode baru
          setMode("new");
          setExistingSesiId(null);
          setExistingSummary(null);
          const baseStudents = await fetchStudents(kelasId);

          // Auto-fill from active permissions
          const mergedStudents = baseStudents.map((s: Student) => {
            const foundIzin = izins.find((i: any) => i.siswaId === s.id);
            if (foundIzin) {
              return {
                ...s,
                status: foundIzin.tipe === "SAKIT" ? "Sakit" : "Izin",
              };
            }
            return { ...s, status: "" };
          });
          setStudents(mergedStudents);
          setActivity("");
        }
      } catch {
        toast.error("Gagal memeriksa status absensi");
      } finally {
        setCheckingStatus(false);
      }
    },
    [fetchStudents],
  );

  // Init
  useEffect(() => {
    setIsClient(true);
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // Ketika id atau date berubah → cek status
  useEffect(() => {
    if (id && date) {
      checkAttendanceStatus(id as string, date);
    }
  }, [id, date, checkAttendanceStatus]);

  const handleStatusChange = (studentId: number, newStatus: string) => {
    setStudents(
      students.map((s) =>
        s.id === studentId ? { ...s, status: newStatus } : s,
      ),
    );
  };

  const markAllHadir = () => {
    setStudents(students.map((s) => ({ ...s, status: "Hadir" })));
  };

  const handleSimpan = () => {
    if (students.some((s) => s.status === "")) {
      toast.error("Mohon lengkapi status kehadiran semua siswa.");
      return;
    }
    setSaveState("saved");
  };

  // Submit baru
  const handleSubmit = async () => {
    setSaveState("submitting");
    const loadingToast = toast.loading("Menyimpan absensi...");
    try {
      const res = await fetch("/api/teacher/attendance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelasId: id,
          tanggal: date,
          notes: activity,
          students,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message, { id: loadingToast });
        setSaveState("submitted");
        setMode("edit");
        setExistingSesiId(data.sesiId);
        // Refresh summary
        const summary = {
          hadir: students.filter((s) => s.status === "Hadir").length,
          sakit: students.filter((s) => s.status === "Sakit").length,
          izin: students.filter((s) => s.status === "Izin").length,
          alpa: students.filter((s) => s.status === "Alpa").length,
          total: students.length,
        };
        setExistingSummary(summary);
      } else {
        toast.error(data.message || "Gagal menyimpan absensi", {
          id: loadingToast,
        });
        setSaveState("saved");
      }
    } catch {
      toast.error("Terjadi kesalahan server", { id: loadingToast });
      setSaveState("saved");
    }
  };

  // Update absensi yang sudah ada
  const handleUpdate = async () => {
    if (!existingSesiId) return;
    if (students.some((s) => s.status === "")) {
      toast.error("Mohon lengkapi status kehadiran semua siswa.");
      return;
    }
    setSaveState("submitting");
    const loadingToast = toast.loading("Memperbarui absensi...");
    try {
      const res = await fetch("/api/teacher/attendance/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sesiId: existingSesiId,
          notes: activity,
          students,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Absensi berhasil diperbarui!", { id: loadingToast });
        setSaveState("submitted");
        const summary = {
          hadir: students.filter((s) => s.status === "Hadir").length,
          sakit: students.filter((s) => s.status === "Sakit").length,
          izin: students.filter((s) => s.status === "Izin").length,
          alpa: students.filter((s) => s.status === "Alpa").length,
          total: students.length,
        };
        setExistingSummary(summary);
      } else {
        toast.error(data.message || "Gagal memperbarui absensi", {
          id: loadingToast,
        });
        setSaveState("submitted");
      }
    } catch {
      toast.error("Terjadi kesalahan server", { id: loadingToast });
      setSaveState("submitted");
    }
  };

  const handleEnableEdit = () => {
    setSaveState("saved");
  };

  // Hitung summary real-time
  const summary = {
    Hadir: students.filter((s) => s.status === "Hadir").length,
    Sakit: students.filter((s) => s.status === "Sakit").length,
    Izin: students.filter((s) => s.status === "Izin").length,
    Alpa: students.filter((s) => s.status === "Alpa").length,
  };

  const isLocked = saveState === "submitted" || saveState === "submitting";
  // Tampilkan nama kelas dari DB; "..." saat masih loading agar tidak flash angka ID
  const displayKelas = kelasNama || "";

  if (!isClient) return null;

  return (
    <Layout role="teacher" hasSidebar={true}>
      <Toaster position="top-right" />

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Tandai Kehadiran — Kelas {displayKelas.toUpperCase()}
          </h1>
          <p className="text-zinc-500">Isi dan lengkapi data presensi siswa.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {!isLocked && (
            <Button variant="outline" onClick={markAllHadir}>
              Mark All Hadir
            </Button>
          )}

          {/* Tombol sesuai state */}
          {saveState === "initial" && (
            <Button variant="primary" onClick={handleSimpan}>
              <Save size={18} /> Simpan
            </Button>
          )}
          {saveState === "saved" && mode === "new" && (
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmit}
            >
              <CheckCircle2 size={18} /> Submit
            </Button>
          )}
          {saveState === "saved" && mode === "edit" && (
            <Button
              variant="primary"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={handleUpdate}
            >
              <RefreshCw size={18} /> Perbarui Absensi
            </Button>
          )}
          {saveState === "submitting" && (
            <Button variant="primary" disabled className="opacity-70">
              <RefreshCw size={18} className="animate-spin" /> Menyimpan...
            </Button>
          )}
          {saveState === "submitted" && (
            <Button
              variant="outline"
              onClick={handleEnableEdit}
              className="border-amber-400 text-amber-700 hover:bg-amber-50"
            >
              <Edit3 size={18} /> Edit Absensi
            </Button>
          )}
        </div>
      </div>

      {/* Banner: Sudah Absen Hari Ini */}
      {mode === "edit" && date === new Date().toISOString().split("T")[0] && (
        <div className="mb-6 p-6 rounded-xl border border-emerald-200 bg-emerald-50/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <CheckCircle2
                size={20}
                className="text-emerald-600 flex-shrink-0"
              />
              <div>
                <p className="font-semibold text-emerald-800">
                  Absensi hari ini sudah dilakukan
                </p>
                <p className="text-sm text-emerald-600">
                  Klik &quot;Edit Absensi&quot; jika ingin mengubah data
                  kehadiran.
                </p>
              </div>
            </div>
            {existingSummary && (
              <div className="flex gap-4 text-center justify-start sm:justify-end">
                {[
                  { label: "Hadir", val: existingSummary.hadir, color: "text-emerald-700" },
                  { label: "Sakit", val: existingSummary.sakit, color: "text-yellow-700" },
                  { label: "Izin", val: existingSummary.izin, color: "text-blue-700" },
                  { label: "Alpa", val: existingSummary.alpa, color: "text-red-700" },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <p className={`text-xl font-bold ${color}`}>{val}</p>
                    <p className="text-xs text-zinc-500">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Banner: Tanggal lain yang sudah punya absensi */}
      {mode === "edit" && date !== new Date().toISOString().split("T")[0] && (
        <div className="mb-6 p-6 rounded-xl border border-amber-200 bg-amber-50/80 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-amber-800">
                Absensi untuk tanggal ini sudah pernah dilakukan
              </p>
              <p className="text-sm text-amber-600">
                Data kehadiran telah dimuat. Klik &quot;Edit Absensi&quot; untuk
                melakukan perubahan.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Checking status loader */}
      {checkingStatus && (
        <div className="mb-6 p-6 rounded-xl border border-zinc-200 bg-zinc-50/80 shadow-sm">
          <div className="flex items-center gap-3">
            <RefreshCw size={18} className="text-zinc-400 animate-spin" />
            <p className="text-sm text-zinc-500">Memeriksa status absensi...</p>
          </div>
        </div>
      )}

      {/* Banner: Siswa yang Izin/Sakit Hari Ini */}
      {activeIzins && activeIzins.length > 0 && (
        <div className="mb-6 p-6 rounded-xl border border-orange-200 bg-orange-50/90 text-orange-955 shadow-sm">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-orange-900">
                  Pemberitahuan Izin/Sakit Hari Ini
                </p>
              </div>
            </div>
            <div className="mt-2 pl-8 space-y-1.5">
              {activeIzins.map((i: any) => (
                <div
                  key={i.siswaId}
                  className="text-sm text-orange-955 font-medium flex items-center gap-1.5 flex-wrap"
                >
                  •{" "}
                  <button
                    type="button"
                    onClick={() => setSelectedIzin(i)}
                    className="font-bold text-orange-700 hover:text-orange-900 hover:underline cursor-pointer transition-colors text-left"
                  >
                    {i.siswaNama}
                  </button>{" "}
                  <span className="text-orange-600 font-semibold text-xs">({i.tipe === "SAKIT" ? "Sakit" : "Izin"})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Informasi Sesi
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Catatan Harian
                </label>
                <textarea
                  value={activity}
                  disabled={isLocked}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="Opsional: Keterangan kelas hari ini"
                  rows={4}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none disabled:bg-zinc-100 disabled:text-zinc-400"
                />
              </div>

              {/* Rekap Real-time */}
              {(saveState === "saved" || saveState === "submitted") &&
                students.some((s) => s.status !== "") && (
                  <div className="mt-2 pt-4 border-t border-zinc-100">
                    <p className="text-xs font-medium text-zinc-500 mb-3 uppercase tracking-wide">
                      Rekap Sementara
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        {
                          label: "Hadir",
                          val: summary.Hadir,
                          bg: "bg-emerald-50",
                          text: "text-emerald-700",
                        },
                        {
                          label: "Sakit",
                          val: summary.Sakit,
                          bg: "bg-yellow-50",
                          text: "text-yellow-700",
                        },
                        {
                          label: "Izin",
                          val: summary.Izin,
                          bg: "bg-blue-50",
                          text: "text-blue-700",
                        },
                        {
                          label: "Alpa",
                          val: summary.Alpa,
                          bg: "bg-red-50",
                          text: "text-red-700",
                        },
                      ].map(({ label, val, bg, text }) => (
                        <div
                          key={label}
                          className={`${bg} rounded-lg p-2 text-center`}
                        >
                          <p className={`text-xl font-bold ${text}`}>{val}</p>
                          <p className="text-xs text-zinc-500">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </Card>
        </div>

        {/* Table Section */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-orange">
              <h2 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                Daftar Siswa
                {mode === "edit" && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                    Mode Edit
                  </span>
                )}
              </h2>
              <span className="text-sm text-zinc-400">
                {students.length} siswa
              </span>
            </div>
            <TableWrapper>
              <Thead>
                <Tr>
                  <Th>No</Th>
                  <Th>Nama Siswa</Th>
                  <Th>Status Kehadiran</Th>
                </Tr>
              </Thead>
              <Tbody>
                {students.length === 0 && (
                  <Tr>
                    <Td colSpan={3} className="text-center text-zinc-400 py-8">
                      {checkingStatus
                        ? "Memuat data..."
                        : "Tidak ada data siswa"}
                    </Td>
                  </Tr>
                )}
                {students.map((student, idx) => {
                  const hasIzin = activeIzins.find(
                    (i: any) => i.siswaId === student.id,
                  );
                  return (
                    <Tr key={student.id}>
                      <Td className="text-zinc-400 text-sm w-10">{idx + 1}</Td>
                      <Td className="font-medium text-zinc-900">
                        <div className="flex flex-col">
                          <span>{student.name}</span>
                          {hasIzin && (
                            <span className="text-xs text-blue-600 font-semibold mt-0.5">
                              Keterangan Tidak Hadir: {hasIzin.tipe} 
                            </span>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-4">
                          {["Hadir", "Izin", "Sakit", "Alpa"].map((st) => (
                            <label
                              key={st}
                              className={`flex items-center gap-2 cursor-pointer group ${isLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="radio"
                                name={`status-${student.id}`}
                                value={st}
                                checked={student.status === st}
                                disabled={isLocked}
                                onChange={() =>
                                  handleStatusChange(student.id, st)
                                }
                                className="w-4 h-4 rounded-full border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                              />
                              <span
                                className={`text-sm ${
                                  student.status === st
                                    ? "font-semibold text-zinc-900"
                                    : "text-zinc-500 group-hover:text-zinc-700"
                                }`}
                              >
                                {st}
                              </span>
                            </label>
                          ))}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </TableWrapper>
          </Card>
        </div>
      </div>
      {/* Modal Detail Izin Kehadiran */}
      {selectedIzin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedIzin(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md z-10 overflow-hidden font-sans border border-zinc-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-orange-50/50">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">Detail Izin Kehadiran</h3>
                <p className="text-[11px] text-orange-700 font-semibold mt-0.5">Pengajuan dari Orang Tua</p>
              </div>
              <button type="button" onClick={() => setSelectedIzin(null)} className="text-zinc-400 hover:text-zinc-650 transition-colors p-1 rounded-lg hover:bg-zinc-100 cursor-pointer">
                <X size={18} />
              </button>
            </div>
            {/* Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Nama Siswa</p>
                  <p className="text-sm font-bold text-zinc-900 mt-0.5">{selectedIzin.siswaNama}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Tipe Izin</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${selectedIzin.tipe === "SAKIT" ? "bg-yellow-50 text-yellow-700 border border-yellow-250 font-semibold" : "bg-blue-50 text-blue-700 border border-blue-250 font-semibold"}`}>
                    {selectedIzin.tipe}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Durasi Izin</p>
                <p className="text-xs font-bold text-zinc-800 mt-1">
                  {formatDateIndo(selectedIzin.mulai)} — {formatDateIndo(selectedIzin.selesai)}
                </p>
                <p className="text-[11px] font-semibold text-blue-600 mt-1 bg-blue-50 px-2.5 py-0.5 rounded w-fit">
                  {calculateDaysDiff(selectedIzin.mulai, selectedIzin.selesai)} Hari
                </p>
              </div>

              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Perihal / Alasan</p>
                <p className="text-xs text-zinc-700 bg-zinc-50 rounded-xl p-3 border border-zinc-100 mt-1 leading-relaxed whitespace-pre-line">
                  {selectedIzin.perihal}
                </p>
              </div>

              {selectedIzin.foto ? (
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 mb-2">Lampiran Bukti Foto</p>
                  <div className="border border-zinc-150 rounded-2xl overflow-hidden shadow-sm max-w-full">
                    <img
                      src={selectedIzin.foto}
                      alt="Bukti Foto Izin"
                      className="w-full object-contain max-h-[200px] bg-zinc-50"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Lampiran Bukti Foto</p>
                  <p className="text-xs text-zinc-400 mt-1 italic">Tidak ada lampiran foto yang diunggah.</p>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIzin(null)}
                className="px-4 py-2 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors shadow-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
