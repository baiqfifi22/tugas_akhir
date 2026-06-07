import React, { useState, useEffect } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  User,
  Calendar,
  FileText,
  Plus,
  CheckCircle2,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["GURU", "KEPALA_SEKOLAH"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

interface Student {
  id: string;
  name: string;
  nis: string;
  avatar: string;
}

interface Report {
  id: string;
  studentId: string;
  studentName: string;
  notes: string;
  createdAt: string;
}

export default function TeacherConnector() {
  const router = useRouter();
  const { id } = router.query;
  const kelasId = typeof id === "string" ? id : "";

  // ── Data State ─────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [kelasNama, setKelasNama] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // ── UI State ───────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ── Fetch data on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!kelasId) return;
    setIsLoading(true);
    setLoadError("");

    fetch(`/api/teacher/reports?kelasId=${kelasId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) throw new Error(data.message || "Gagal memuat data");
        setKelasNama(data.kelasNama || kelasId);
        setStudents(data.students || []);
        setReports(data.reports || []);
      })
      .catch((err) => {
        console.error(err);
        setLoadError("Gagal memuat data. Coba refresh halaman.");
      })
      .finally(() => setIsLoading(false));
  }, [kelasId]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.includes(searchQuery)
  );

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const studentReports = reports
    .filter((r) => r.studentId === selectedStudentId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  // ── Submit laporan ─────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !notes.trim()) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const res = await fetch("/api/teacher/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, notes: notes.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan laporan");
      }

      // Tambahkan laporan baru ke list lokal (optimistic update)
      setReports((prev) => [data.report, ...prev]);
      setNotes("");
      setIsAdding(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Layout role="teacher" hasSidebar={true}>
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Buku Penghubung</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Laporan perkembangan siswa · Kelas {kelasNama || kelasId}
          </p>
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-400 gap-3">
          <Loader2 size={36} className="animate-spin text-blue-500" />
          <p className="text-sm">Memuat data siswa...</p>
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3 text-red-500">
          <AlertCircle size={36} />
          <p className="text-sm">{loadError}</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">

          {/* ─── Left Sidebar: Student List ──────────────────────────────── */}
          <Card className="w-full lg:w-80 flex flex-col p-0 overflow-hidden shrink-0 h-full border-zinc-200">
            {/* Search Bar */}
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                  size={16}
                />
                <input
                  type="text"
                  id="search-siswa"
                  placeholder="Cari nama atau NIS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-gray-500 pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
              <p className="text-xs text-zinc-400 mt-2 px-1">
                {filteredStudents.length} dari {students.length} siswa
              </p>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-zinc-400 text-sm py-8">
                  {searchQuery ? "Siswa tidak ditemukan" : "Tidak ada siswa di kelas ini"}
                </p>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = student.id === selectedStudentId;
                  const reportCount = reports.filter(
                    (r) => r.studentId === student.id
                  ).length;

                  return (
                    <button
                      key={student.id}
                      id={`student-${student.id}`}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setIsAdding(false);
                        setNotes("");
                        setSaveError("");
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${isSelected
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-zinc-50 border border-transparent"
                        }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-100 text-zinc-600"
                          }`}
                      >
                        {student.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${isSelected ? "text-blue-900" : "text-zinc-900"
                            }`}
                        >
                          {student.name}
                        </p>
                        <p
                          className={`text-xs ${isSelected ? "text-blue-600" : "text-zinc-500"
                            }`}
                        >
                          NIS: {student.nis}
                        </p>
                      </div>
                      {reportCount > 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${isSelected
                            ? "bg-blue-200 text-blue-800"
                            : "bg-zinc-100 text-zinc-500"
                            }`}
                        >
                          {reportCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* ─── Right Content ───────────────────────────────────────────── */}
          <Card className="flex-1 flex flex-col p-0 overflow-hidden h-full border-zinc-200">
            {selectedStudent ? (
              <>
                {/* Student Header */}
                <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {selectedStudent.avatar}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900">
                        {selectedStudent.name}
                      </h2>
                      <p className="text-sm text-zinc-500">
                        Kelas {kelasNama} · NIS {selectedStudent.nis}
                      </p>
                    </div>
                  </div>
                  {!isAdding && (
                    <Button
                      id="btn-buat-laporan"
                      variant="primary"
                      onClick={() => {
                        setIsAdding(true);
                        setSaveError("");
                      }}
                    >
                      <Plus size={18} />
                      Buat Laporan
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 space-y-6">
                  {/* Success Banner */}
                  {isSaved && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl text-sm font-medium">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      Laporan berhasil disimpan ke database!
                    </div>
                  )}

                  {/* Form Add New */}
                  {isAdding && (
                    <Card className="border-blue-200 bg-blue-50/40 shadow-sm">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                          <FileText size={18} className="text-blue-600" />
                          Tulis Laporan Baru
                        </h3>
                        <button
                          onClick={() => {
                            setIsAdding(false);
                            setNotes("");
                            setSaveError("");
                          }}
                          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                        >
                          Batal
                        </button>
                      </div>

                      <form onSubmit={handleSave} className="space-y-4">
                        {/* Siswa readonly info */}
                        <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                            {selectedStudent.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-800">
                              {selectedStudent.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              NIS {selectedStudent.nis} · Kelas {kelasNama}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="laporan-notes"
                            className="block text-sm font-bold text-zinc-700 mb-1.5"
                          >
                            Catatan Perkembangan
                          </label>
                          <textarea
                            id="laporan-notes"
                            rows={5}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Tulis catatan perkembangan, perilaku, atau informasi penting lainnya untuk orang tua..."
                            className="w-full border text-gray-500 border-zinc-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                            required
                          />
                          <p className="text-xs text-zinc-400 mt-1">
                            {notes.length} karakter
                          </p>
                        </div>

                        {saveError && (
                          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                            <AlertCircle size={16} className="shrink-0" />
                            {saveError}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAdding(false);
                              setNotes("");
                              setSaveError("");
                            }}
                            className="text-sm text-zinc-500 hover:text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
                          >
                            Batal
                          </button>
                          <Button
                            id="btn-submit-laporan"
                            type="submit"
                            variant="primary"
                            disabled={!notes.trim() || isSaving}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 size={16} className="animate-spin" />
                                Menyimpan...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={16} />
                                Simpan Laporan
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Card>
                  )}

                  {/* History List */}
                  <div>
                    <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                      Riwayat Laporan ({studentReports.length})
                    </h3>
                    {studentReports.length === 0 ? (
                      <div className="text-center py-16 text-zinc-300">
                        <FileText size={48} className="mx-auto mb-3 opacity-40" />
                        <p className="text-sm text-zinc-400">
                          Belum ada laporan untuk siswa ini.
                        </p>
                        <p className="text-xs text-zinc-300 mt-1">
                          Klik "Buat Laporan" untuk menambahkan catatan.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {studentReports.map((report) => (
                          <div
                            key={report.id}
                            className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-blue-100 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                Laporan #{report.id}
                              </span>
                              <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                                <Calendar size={12} />
                                {report.createdAt}
                              </span>
                            </div>
                            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                              {report.notes}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 p-8 gap-4">
                <User size={56} className="opacity-30" />
                <div className="text-center">
                  <p className="text-zinc-500 font-medium">Pilih Siswa</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Cari dan klik nama siswa di daftar kiri untuk melihat atau
                    menambah laporan.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </Layout>
  );
}
