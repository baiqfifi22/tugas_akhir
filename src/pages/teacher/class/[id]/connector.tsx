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
  ArrowLeft,
  ChevronDown,
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
  isStructured: boolean;
  perilaku?: string | null;
  akademik?: string | null;
  kedisiplinan?: string | null;
  catatanKhusus?: string | null;
  rekomendasi?: string | null;
  createdAt: string;
}

interface LaporanFields {
  perilaku: string;
  akademik: string;
  kedisiplinan: string;
  catatanKhusus: string;
  rekomendasi: string;
}

const FIELD_CONFIG: {
  key: keyof LaporanFields;
  label: string;
  placeholder: string;
  required: boolean;
}[] = [
  {
    key: "perilaku",
    label: "Perilaku & Sikap",
    placeholder: "Catatan mengenai sikap, sopan santun, dan interaksi siswa di kelas...",
    required: false,
  },
  {
    key: "akademik",
    label: "Perkembangan Akademik",
    placeholder: "Progress nilai, pemahaman materi, keaktifan belajar...",
    required: false,
  },
  {
    key: "kedisiplinan",
    label: "Kedisiplinan",
    placeholder: "Ketepatan waktu, mengerjakan tugas, kepatuhan aturan...",
    required: false,
  },
  {
    key: "catatanKhusus",
    label: "Hal yang Perlu Diperhatikan",
    placeholder: "Masalah atau tantangan yang butuh perhatian khusus orang tua... (opsional)",
    required: false,
  },
  {
    key: "rekomendasi",
    label: "Pesan & Rekomendasi",
    placeholder: "Saran dan tindak lanjut yang direkomendasikan untuk orang tua... (opsional)",
    required: false,
  },
];

function StructuredReportDisplay({ report }: { report: Report }) {
  const fields = [
    { label: "Perilaku & Sikap", value: report.perilaku },
    { label: "Perkembangan Akademik", value: report.akademik },
    { label: "Kedisiplinan", value: report.kedisiplinan },
    { label: "Hal yang Perlu Diperhatikan", value: report.catatanKhusus },
    { label: "Pesan & Rekomendasi", value: report.rekomendasi },
  ].filter((f) => f.value && f.value.trim());

  if (!report.isStructured || fields.length === 0) {
    return (
      <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
        {report.notes}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {fields.map((f) => (
        <div key={f.label}>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
            {f.label}
          </p>
          <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
            {f.value}
          </p>
        </div>
      ))}
    </div>
  );
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
  const [fields, setFields] = useState<LaporanFields>({
    perilaku: "",
    akademik: "",
    kedisiplinan: "",
    catatanKhusus: "",
    rekomendasi: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [activeView, setActiveView] = useState<"list" | "detail">("list");

  const resetFields = () =>
    setFields({ perilaku: "", akademik: "", kedisiplinan: "", catatanKhusus: "", rekomendasi: "" });

  const hasContent =
    fields.perilaku.trim() ||
    fields.akademik.trim() ||
    fields.kedisiplinan.trim() ||
    fields.catatanKhusus.trim() ||
    fields.rekomendasi.trim();

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
    if (!selectedStudentId || !hasContent) return;

    setIsSaving(true);
    setSaveError("");

    try {
      const res = await fetch("/api/teacher/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudentId, ...fields }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal menyimpan laporan");
      }

      setReports((prev) => [data.report, ...prev]);
      resetFields();
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

          {/* ─── Left Sidebar ──────────────────────────────────────────── */}
          <Card
            className={`w-full lg:w-80 flex flex-col p-0 overflow-hidden shrink-0 h-full border-zinc-200 ${
              activeView === "list" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
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

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-zinc-400 text-sm py-8">
                  {searchQuery ? "Siswa tidak ditemukan" : "Tidak ada siswa di kelas ini"}
                </p>
              ) : (
                filteredStudents.map((student) => {
                  const isSelected = student.id === selectedStudentId;
                  const reportCount = reports.filter((r) => r.studentId === student.id).length;
                  return (
                    <button
                      key={student.id}
                      id={`student-${student.id}`}
                      onClick={() => {
                        setSelectedStudentId(student.id);
                        setIsAdding(false);
                        resetFields();
                        setSaveError("");
                        setActiveView("detail");
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        isSelected
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-zinc-50 border border-transparent"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                          isSelected ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {student.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-bold truncate ${isSelected ? "text-blue-900" : "text-zinc-900"}`}>
                          {student.name}
                        </p>
                        <p className={`text-xs ${isSelected ? "text-blue-600" : "text-zinc-500"}`}>
                          NIS: {student.nis}
                        </p>
                      </div>
                      {reportCount > 0 && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-semibold shrink-0 ${
                            isSelected ? "bg-blue-200 text-blue-800" : "bg-zinc-100 text-zinc-500"
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

          {/* ─── Right Content ───────────────────────────────────────── */}
          <Card
            className={`flex-1 flex flex-col p-0 overflow-hidden h-full border-zinc-200 ${
              activeView === "detail" ? "flex" : "hidden lg:flex"
            }`}
          >
            {selectedStudent ? (
              <>
                {/* Student Header */}
                <div className="p-4 md:p-6 border-b border-zinc-100 flex items-center justify-between gap-4 bg-white shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => setActiveView("list")}
                      className="lg:hidden p-2 -ml-1 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors shrink-0"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <div className="hidden md:flex w-10 h-10 rounded-full bg-blue-100 items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {selectedStudent.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm sm:text-base md:text-lg font-bold text-zinc-900 leading-tight truncate">
                        {selectedStudent.name}
                      </h2>
                      <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 truncate">
                        Kelas {kelasNama} · NIS {selectedStudent.nis}
                      </p>
                    </div>
                  </div>
                  {!isAdding && (
                    <Button
                      id="btn-buat-laporan"
                      variant="primary"
                      onClick={() => { setIsAdding(true); setSaveError(""); }}
                      className="shrink-0 justify-center text-xs sm:text-sm py-2 px-3 sm:py-2.5 sm:px-4"
                    >
                      <Plus size={16} />
                      Buat Laporan
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30 space-y-6">
                  {/* Success Banner */}
                  {isSaved && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl text-sm font-medium">
                      <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      Laporan berhasil disimpan!
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
                          onClick={() => { setIsAdding(false); resetFields(); setSaveError(""); }}
                          className="text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                        >
                          Batal
                        </button>
                      </div>

                      <form onSubmit={handleSave} className="space-y-4">
                        {/* Siswa info */}
                        <div className="bg-white border border-zinc-200 rounded-lg px-4 py-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                            {selectedStudent.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-zinc-800">{selectedStudent.name}</p>
                            <p className="text-xs text-zinc-500">NIS {selectedStudent.nis} · Kelas {kelasNama}</p>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-400 -mt-1">Isi minimal satu field di bawah ini.</p>

                        {/* 5 Structured Fields */}
                        {FIELD_CONFIG.map((fc) => (
                          <div key={fc.key}>
                            <label
                              htmlFor={`field-${fc.key}`}
                              className="block text-sm font-bold text-zinc-700 mb-1.5"
                            >
                              {fc.label}
                              {["catatanKhusus", "rekomendasi"].includes(fc.key) && (
                                <span className="ml-2 text-xs font-normal text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">Opsional</span>
                              )}
                            </label>
                            <textarea
                              id={`field-${fc.key}`}
                              rows={3}
                              value={fields[fc.key]}
                              onChange={(e) =>
                                setFields((prev) => ({ ...prev, [fc.key]: e.target.value }))
                              }
                              placeholder={fc.placeholder}
                              className="w-full border text-gray-500 border-zinc-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all"
                            />
                          </div>
                        ))}

                        {saveError && (
                          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                            <AlertCircle size={16} className="shrink-0" />
                            {saveError}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => { setIsAdding(false); resetFields(); setSaveError(""); }}
                            className="text-sm text-zinc-500 hover:text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-100 transition-colors"
                          >
                            Batal
                          </button>
                          <Button
                            id="btn-submit-laporan"
                            type="submit"
                            variant="primary"
                            disabled={!hasContent || isSaving}
                          >
                            {isSaving ? (
                              <><Loader2 size={16} className="animate-spin" /> Menyimpan...</>
                            ) : (
                              <><CheckCircle2 size={16} /> Simpan Laporan</>
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
                        <p className="text-sm text-zinc-400">Belum ada laporan untuk siswa ini.</p>
                        <p className="text-xs text-zinc-300 mt-1">Klik "Buat Laporan" untuk menambahkan catatan.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {studentReports.map((report) => (
                          <div
                            key={report.id}
                            className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-blue-100 hover:shadow-md transition-all"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                Laporan #{report.id}
                              </span>
                              <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                                <Calendar size={12} />
                                {report.createdAt}
                              </span>
                            </div>
                            <StructuredReportDisplay report={report} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 p-8 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveView("list")}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 font-medium text-sm transition-colors"
                >
                  <ArrowLeft size={16} /> Kembali ke Daftar Siswa
                </button>
                <User size={56} className="opacity-30" />
                <div className="text-center">
                  <p className="text-zinc-500 font-medium">Pilih Siswa</p>
                  <p className="text-sm text-zinc-400 mt-1">
                    Cari dan klik nama siswa di daftar kiri untuk melihat atau menambah laporan.
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
