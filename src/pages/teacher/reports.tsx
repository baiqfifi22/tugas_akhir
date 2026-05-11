import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Search,
  Plus,
  FileText,
  Calendar,
  User,
  ChevronDown,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

interface Student {
  id: string;
  name: string;
  class: string;
}

const MONTHS = [
  "Januari 2026",
  "Februari 2026",
  "Maret 2026",
  "April 2026",
  "Mei 2026",
  "Juni 2026",
];

interface Report {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  period: string;
  notes: string;
  createdAt: string;
}

export default function TeacherReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [period, setPeriod] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  // Ambil data reports dan students dari API
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/teacher/reports");
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setReports(data.reports);
            setStudents(data.students);
          }
        }
      } catch (error) {
        toast.error("Gagal memuat data laporan");
      }
    };
    fetchData();
  }, []);

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedStudent || !period || !notes.trim()) return;

    const loadingToast = toast.loading("Menyimpan laporan...");
    try {
      const res = await fetch("/api/teacher/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          period: period,
          notes: notes.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Laporan berhasil disimpan!", { id: loadingToast });
        
        // Update local state by adding the newly returned report
        const newReport = data.report;
        newReport.studentClass = selectedStudent.class; // Inject class manually for immediate display
        newReport.period = period; // Inject period manually
        setReports((prev) => [newReport, ...prev]);
        
        // Reset form
        setSelectedStudent(null);
        setSearch("");
        setPeriod("");
        setNotes("");
        setShowForm(false);
      } else {
        toast.error(data.message || "Gagal menyimpan laporan", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan server", { id: loadingToast });
    }
  };

  const isFormValid = selectedStudent && period && notes.trim().length > 0;

  return (
    <Layout role="teacher" hasSidebar={true}>
      <Toaster position="top-right" />
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Laporan Perkembangan Siswa
          </h1>
          <p className="text-zinc-500">
            Buat dan kelola catatan perkembangan siswa per periode.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setShowForm(!showForm);
          }}
        >
          <Plus size={18} />
          {showForm ? "Tutup Form" : "Buat Laporan"}
        </Button>
      </div>

      {/* Form Input */}
      {showForm && (
        <Card className="mb-8 border-blue-100 bg-blue-50/20">
          <h2 className="text-base font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <FileText size={18} className="text-blue-600" />
            Form Laporan Perkembangan
          </h2>

          <div className="space-y-5">
            {/* Pilih Siswa */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <User size={14} className="inline mr-1" />
                Pilih Siswa
              </label>
              <div className="relative">
                <div className="flex items-center border border-zinc-200 rounded-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-colors">
                  <Search size={16} className="ml-3 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa..."
                    value={
                      selectedStudent && !showDropdown
                        ? selectedStudent.name
                        : search
                    }
                    onFocus={() => {
                      setShowDropdown(true);
                      if (selectedStudent) {
                        setSearch("");
                        setSelectedStudent(null);
                      }
                    }}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    className="flex-1 px-3 py-2.5 text-sm text-zinc-700 bg-transparent focus:outline-none"
                  />
                  {selectedStudent && (
                    <span className="mr-3 text-xs text-zinc-400 shrink-0">
                      {selectedStudent.class}
                    </span>
                  )}
                  <ChevronDown size={16} className="mr-3 text-zinc-400 shrink-0" />
                </div>
                {showDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-zinc-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {filteredStudents.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-zinc-400">
                        Siswa tidak ditemukan
                      </div>
                    ) : (
                      filteredStudents.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center justify-between"
                          onClick={() => {
                            setSelectedStudent(s);
                            setSearch("");
                            setShowDropdown(false);
                          }}
                        >
                          <span className="font-medium">{s.name}</span>
                          <span className="text-xs text-zinc-400">
                            {s.class}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedStudent && (
                <p className="mt-1 text-xs text-blue-600">
                  ✓ {selectedStudent.name} — Kelas {selectedStudent.class}
                </p>
              )}
            </div>

            {/* Periode */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <Calendar size={14} className="inline mr-1" />
                Periode (Bulan)
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              >
                <option value="">-- Pilih Bulan --</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Catatan */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                <FileText size={14} className="inline mr-1" />
                Catatan Perkembangan
              </label>
              <textarea
                rows={4}
                placeholder="Tuliskan catatan perkembangan siswa di sini..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2.5 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
              />
              <p className="text-xs text-zinc-400 mt-1">
                {notes.length} karakter
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={!isFormValid}
              >
                Simpan Laporan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setSelectedStudent(null);
                  setSearch("");
                  setPeriod("");
                  setNotes("");
                }}
              >
                Batal
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Daftar Laporan */}
      <div>
        <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-blue-600" />
          Laporan yang Sudah Dibuat
          <span className="ml-1 text-sm font-medium text-zinc-400">
            ({reports.length})
          </span>
        </h2>

        {reports.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-500">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p>Belum ada laporan yang dibuat.</p>
            <p className="text-sm mt-1">
              Klik &quot;Buat Laporan&quot; di atas untuk memulai.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id} className="group hover:border-blue-100 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {report.period}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                        Kelas {report.studentClass}
                      </span>
                    </div>
                    <h3 className="font-bold text-zinc-900 mb-1 flex items-center gap-2">
                      <User size={14} className="text-zinc-400" />
                      {report.studentName}
                    </h3>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {report.notes}
                    </p>
                  </div>
                  <div className="text-xs text-zinc-400 shrink-0 flex items-center gap-1">
                    <Calendar size={12} />
                    {report.createdAt}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
