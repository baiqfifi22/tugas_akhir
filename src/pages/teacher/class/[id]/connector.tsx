import React, { useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Calendar, FileText, Plus, CheckCircle2, Search } from "lucide-react";

interface Student {
  id: string;
  name: string;
  nis: string;
  avatar: string;
}

const MONTHS = [
  "Januari 2026", "Februari 2026", "Maret 2026", 
  "April 2026", "Mei 2026", "Juni 2026"
];

interface Report {
  id: string;
  studentId: string;
  period: string;
  notes: string;
  createdAt: string;
}

export default function TeacherConnector() {
  const router = useRouter();
  const classId = typeof router.query.id === "string" ? router.query.id.toUpperCase() : "10-A";

  const [reports, setReports] = useState<Report[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [period, setPeriod] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaved, setIsSaved] = useState(false);

  // TODO: Ambil data students dan reports dari database berdasarkan classId
  React.useEffect(() => {
    // fetchStudents();
    // fetchReports();
  }, [classId]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.nis.includes(searchQuery)
  );

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const studentReports = reports.filter(r => r.studentId === selectedStudentId);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !period || !notes.trim()) return;

    const newReport: Report = {
      id: `r${Date.now()}`,
      studentId: selectedStudentId,
      period,
      notes: notes.trim(),
      createdAt: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    };

    setReports([newReport, ...reports]);
    setPeriod("");
    setNotes("");
    setIsAdding(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <Layout role="teacher" hasSidebar={true}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Buku Penghubung</h1>
          <p className="text-zinc-500">Laporan perkembangan bulanan untuk siswa kelas {classId}.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
        {/* Left Sidebar: Student List */}
        <Card className="w-full lg:w-80 flex flex-col p-0 overflow-hidden shrink-0 h-full border-zinc-200">
          <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
              <input
                type="text"
                placeholder="Cari siswa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredStudents.map((student) => {
              const isSelected = student.id === selectedStudentId;
              return (
                <button
                  key={student.id}
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    setIsAdding(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isSelected 
                      ? "bg-blue-50 border border-blue-100" 
                      : "hover:bg-zinc-50 border border-transparent"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                    isSelected ? "bg-blue-600 text-white" : "bg-zinc-100 text-zinc-600"
                  }`}>
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
                </button>
              );
            })}
            {filteredStudents.length === 0 && (
              <p className="text-center text-zinc-400 text-sm py-8">Siswa tidak ditemukan</p>
            )}
          </div>
        </Card>

        {/* Right Content: Student Reports & Form */}
        <Card className="flex-1 flex flex-col p-0 overflow-hidden h-full border-zinc-200">
          {selectedStudent ? (
            <>
              {/* Header Profile */}
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    {selectedStudent.avatar}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">{selectedStudent.name}</h2>
                    <p className="text-sm text-zinc-500">Kelas {classId} · NIS {selectedStudent.nis}</p>
                  </div>
                </div>
                {!isAdding && (
                  <Button variant="primary" onClick={() => setIsAdding(true)}>
                    <Plus size={18} />
                    Buat Laporan
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30">
                {isSaved && (
                  <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    Laporan bulan ini berhasil dikirim ke orang tua!
                  </div>
                )}

                {/* Form Add New */}
                {isAdding && (
                  <Card className="mb-8 border-blue-200 bg-blue-50/50 shadow-sm animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" />
                        Tulis Laporan Baru
                      </h3>
                      <button 
                        onClick={() => setIsAdding(false)}
                        className="text-sm text-zinc-500 hover:text-zinc-700"
                      >
                        Batal
                      </button>
                    </div>
                    <form onSubmit={handleSave} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-1.5">Periode Bulan</label>
                        <select
                          value={period}
                          onChange={(e) => setPeriod(e.target.value)}
                          className="w-full sm:w-64 border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                          required
                        >
                          <option value="">-- Pilih Bulan --</option>
                          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-zinc-700 mb-1.5">Catatan Perkembangan</label>
                        <textarea
                          rows={4}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Tulis narasi perkembangan anak di bulan ini secara mendetail..."
                          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                          required
                        />
                      </div>
                      <div className="flex justify-end pt-2">
                        <Button type="submit" variant="primary" disabled={!period || !notes.trim()}>
                          Kirim Laporan
                        </Button>
                      </div>
                    </form>
                  </Card>
                )}

                {/* History List */}
                <div>
                  <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Riwayat Laporan</h3>
                  {studentReports.length === 0 ? (
                    <div className="text-center py-12 text-zinc-400">
                      <FileText size={48} className="mx-auto mb-3 opacity-20" />
                      <p>Belum ada laporan untuk anak ini.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {studentReports.map(report => (
                        <div key={report.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm hover:border-blue-100 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                              {report.period}
                            </span>
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Calendar size={12} /> {report.createdAt}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-700 leading-relaxed">
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
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 p-8">
              <User size={48} className="mb-4 opacity-20" />
              <p>Pilih siswa di daftar samping untuk melihat atau mengisi Buku Penghubung.</p>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
