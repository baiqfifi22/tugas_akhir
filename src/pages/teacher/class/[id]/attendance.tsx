import React, { useState, useEffect } from "react";
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
  ClipboardCheck,
  BarChart2,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface Student {
  id: string;
  name: string;
  status: string;
}

export default function ClassAttendance() {
  const router = useRouter();
  const { id } = router.query;
  const classId = typeof id === "string" ? id : "10-a";

  const [isClient, setIsClient] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState("");
  const [activity, setActivity] = useState("");
  const [saveState, setSaveState] = useState<"initial" | "saved" | "submitted">(
    "initial",
  );

  useEffect(() => {
    setIsClient(true);
    setDate(new Date().toISOString().split("T")[0]);
    
    if (id) {
      const fetchStudents = async () => {
        try {
          const res = await fetch(`/api/teacher/class/${id}/students`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setStudents(data.students);
            }
          } else {
            toast.error("Gagal memuat daftar siswa");
          }
        } catch (error) {
          toast.error("Terjadi kesalahan saat memuat data");
        }
      };
      fetchStudents();
    }
  }, [id]);

  const handleStatusChange = (studentId: string, newStatus: string) => {
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

  const handleSubmit = async () => {
    const loadingToast = toast.loading("Menyimpan absensi...");
    try {
      const res = await fetch("/api/teacher/attendance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kelasId: id,
          tanggal: date,
          notes: activity,
          students: students,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message, { id: loadingToast });
        setSaveState("submitted");
      } else {
        toast.error(data.message || "Gagal menyimpan absensi", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan server", { id: loadingToast });
    }
  };

  // Calculate Summary
  const summary = {
    Hadir: students.filter((s) => s.status === "Hadir").length,
    Sakit: students.filter((s) => s.status === "Sakit").length,
    Izin: students.filter((s) => s.status === "Izin").length,
    Alpa: students.filter((s) => s.status === "Alpa").length,
  };

  if (!isClient) return null;

  return (
    <Layout role="teacher" hasSidebar={true}>
      <Toaster position="top-right" />
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Tandai Kehadiran - Kelas {classId.toUpperCase()}
          </h1>
          <p className="text-zinc-500">
            Isi dan lengkapi data presensi siswa per hari ini.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={markAllHadir}>
            Mark All Hadir
          </Button>

          {saveState === "initial" && (
            <Button variant="primary" onClick={handleSimpan}>
              <Save size={18} /> Simpan
            </Button>
          )}

          {saveState === "saved" && (
            <Button
              variant="primary"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSubmit}
            >
              <CheckCircle2 size={18} /> Submit
            </Button>
          )}

          {saveState === "submitted" && (
            <Button
              variant="primary"
              disabled
              className="opacity-50 cursor-not-allowed"
            >
              Tersubmit
            </Button>
          )}
        </div>
      </div>

      {saveState === "submitted" && (
        <Card className="mb-6 border-emerald-200 bg-emerald-50/50">
          <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} /> Kehadiran Berhasil Disubmit
          </h3>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-sm text-zinc-500">Total Hadir</p>
              <p className="text-xl font-bold text-zinc-900">{summary.Hadir}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-zinc-500">Sakit</p>
              <p className="text-xl font-bold text-zinc-900">{summary.Sakit}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-zinc-500">Izin</p>
              <p className="text-xl font-bold text-zinc-900">{summary.Izin}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-zinc-500">Alpa</p>
              <p className="text-xl font-bold text-zinc-900">{summary.Alpa}</p>
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
                  disabled={saveState === "submitted"}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none text-zinc-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors disabled:bg-zinc-100 disabled:text-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">
                  Catatan Harian
                </label>
                <textarea
                  value={activity}
                  disabled={saveState === "submitted"}
                  onChange={(e) => setActivity(e.target.value)}
                  placeholder="Opsional: Keterangan kelas hari ini"
                  rows={4}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm  text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none disabled:bg-zinc-100 disabled:text-zinc-500"
                />
              </div>
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
              </h2>
            </div>
            <TableWrapper>
              <Thead>
                <Tr>
                  <Th>Nama Siswa</Th>
                  <Th>Status Kehadiran</Th>
                </Tr>
              </Thead>
              <Tbody>
                {students.map((student) => (
                  <Tr key={student.id}>
                    <Td className="font-medium text-zinc-900">
                      {student.name}
                    </Td>
                    <Td>
                      <div className="flex flex-wrap items-center gap-4">
                        {["Hadir", "Izin", "Sakit", "Alpa"].map((st) => (
                          <label
                            key={st}
                            className="flex items-center gap-2 cursor-pointer group"
                          >
                            <input
                              type="radio"
                              name={`status-${student.id}`}
                              value={st}
                              checked={student.status === st}
                              disabled={saveState === "submitted"}
                              onChange={() =>
                                handleStatusChange(student.id, st)
                              }
                              className="w-4 h-4 rounded-full border-zinc-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <span
                              className={`text-sm ${student.status === st ? "font-medium text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700"}`}
                            >
                              {st}
                            </span>
                          </label>
                        ))}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </TableWrapper>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
