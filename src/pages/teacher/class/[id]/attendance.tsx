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
        <Card className="mb-6 border-emerald-200 bg-emerald-50/80">
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
        </Card>
      )}

      {/* Banner: Tanggal lain yang sudah punya absensi */}
      {mode === "edit" && date !== new Date().toISOString().split("T")[0] && (
        <Card className="mb-6 border-amber-200 bg-amber-50/80">
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
        </Card>
      )}

      {/* Checking status loader */}
      {checkingStatus && (
        <Card className="mb-6 border-zinc-200 bg-zinc-50/80">
          <div className="flex items-center gap-3">
            <RefreshCw size={18} className="text-zinc-400 animate-spin" />
            <p className="text-sm text-zinc-500">Memeriksa status absensi...</p>
          </div>
        </Card>
      )}

      {/* Banner: Siswa yang Izin/Sakit Hari Ini */}
      {activeIzins && activeIzins.length > 0 && (
        <Card className="mb-6 border-blue-200 bg-blue-50/85">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800">
                  Pemberitahuan Izin/Sakit Hari Ini
                </p>
                <p className="text-sm text-blue-600">
                  Siswa berikut telah terdaftar mengajukan izin/sakit pada
                  tanggal yang dipilih:
                </p>
              </div>
            </div>
            <div className="mt-1 pl-8 space-y-1">
              {activeIzins.map((i: any) => (
                <div
                  key={i.siswaId}
                  className="text-sm text-zinc-700 font-medium"
                >
                  •{" "}
                  <span className="font-bold text-zinc-900">{i.siswaNama}</span>{" "}
                  ({i.tipe}) -{" "}
                  <span className="italic text-zinc-500">
                    &quot;{i.perihal}&quot;
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
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
            <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-white">
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
                              ⚠️ Izin terdaftar: {hasIzin.tipe} -{" "}
                              {hasIzin.perihal}
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
    </Layout>
  );
}
