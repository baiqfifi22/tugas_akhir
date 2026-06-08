import React, { useState, useEffect, useCallback } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Plus, Search, Edit2, Trash2, MoreVertical, Download,
  Printer, ArrowUpCircle, UserX, UserCheck, Loader2, X, AlertCircle, CheckCircle2,
  GraduationCap, Calendar, CheckSquare, Square, Info
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ADMIN"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

interface Student {
  id: number; nis: string; nama: string; ttl: string;
  jk: string; status: string; kelas: string; kelasId: number | null; ortu: string;
}

interface Kelas { id: number; nama: string; }
interface TahunAjaran { id: number; nama: string; status: string; }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h3 className="font-bold text-zinc-900">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onCancel, loading }: {
  message: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm z-10 p-6 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="text-zinc-700 mb-6 text-sm">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors">Batal</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />} Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Print via hidden iframe ────────────────────────────────────────────────
function printInPage(htmlContent: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;visibility:hidden;top:0;left:0;width:1px;height:1px;border:none;";
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow!.focus();
    iframe.contentWindow!.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 1000);
  };
  iframe.contentDocument!.open();
  iframe.contentDocument!.write(htmlContent);
  iframe.contentDocument!.close();
}

// ── Export CSV ─────────────────────────────────────────────────────────────
function exportCSV(data: Student[], tahunAjaran: string) {
  const safeNama = tahunAjaran.replace(/[^a-zA-Z0-9]/g, "");
  const BOM = "\uFEFF";
  const metaRows = `"Tahun Ajaran: ${tahunAjaran}"\n"Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}"\n\n`;
  const header = "No,NIS,Nama,Kelas,JK,Status,Orang Tua\n";
  const rows = data
    .map((s, i) => `${i + 1},"${s.nis}","${s.nama}","${s.kelas}","${s.jk}","${s.status}","${s.ortu}"`)
    .join("\n");
  const blob = new Blob([BOM + metaRows + header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `data_siswa_${safeNama}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Print PDF ──────────────────────────────────────────────────────────────
function printPDF(data: Student[], tahunAjaran: string) {
  const content = `
    <html><head><title>Data Siswa</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:11px;margin:20px}
      h2{margin-bottom:4px} h3{margin:0 0 8px;color:#555;font-weight:normal;font-size:10px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:5px 8px;text-align:left}
      th{background:#f0f0f0;font-weight:bold}
      tr:nth-child(even){background:#fafafa}
    </style></head><body>
    <h2>Data Siswa &mdash; MI Integral Buah Hati Insani</h2>
    <h3>Tahun Ajaran: ${tahunAjaran} &nbsp;|&nbsp; Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</h3>
    <table>
      <tr><th>No</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>JK</th><th>Status</th><th>Orang Tua</th></tr>
      ${data.map((s, i) => `<tr><td>${i + 1}</td><td>${s.nis}</td><td>${s.nama}</td><td>${s.kelas}</td><td>${s.jk}</td><td>${s.status}</td><td>${s.ortu}</td></tr>`).join("")}
    </table>
    </body></html>`;
  printInPage(content);
}

// Helper cerdas untuk menebak Kelas Asal berdasarkan Kelas Tujuan
function guessSourceClass(targetClassName: string): string {
  const match = targetClassName.match(/^(\d+)([A-Za-z]*)$/);
  if (!match) return "";
  const grade = parseInt(match[1], 10);
  const suffix = match[2];
  if (grade <= 1) return ""; // Murid kelas 1 baru adalah siswa baru (tidak punya kelas asal)
  return `${grade - 1}${suffix}`;
}

// Helper to parse academic year name
function parseAcademicYear(name: string): { year: number; semester: "Ganjil" | "Genap" } {
  const match = name.match(/^(\d{4})\((Ganjil|Genap)\)$/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      semester: match[2] as "Ganjil" | "Genap"
    };
  }
  const yearMatch = name.match(/^(\d{4})/);
  return {
    year: yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear(),
    semester: "Ganjil"
  };
}

// Helper untuk menebak Kelas-kelas Asal berdasarkan aturan spesifik
function guessSourceClasses(targetClassName: string, isSameClassTransition: boolean): string[] {
  if (isSameClassTransition) {
    return targetClassName ? [targetClassName] : [];
  }
  
  if (targetClassName === "2A" || targetClassName === "2B") {
    return ["1A", "1B", "1C"];
  }
  if (targetClassName === "3A") {
    return ["2A"];
  }
  if (targetClassName === "3B") {
    return ["2B"];
  }
  if (targetClassName === "4") {
    return ["3A", "3B"];
  }
  if (targetClassName === "5") {
    return ["4"];
  }
  if (targetClassName === "6") {
    return ["5"];
  }
  
  // Fallback
  const match = targetClassName.match(/^(\d+)([A-Za-z]*)$/);
  if (!match) return [];
  const grade = parseInt(match[1], 10);
  const suffix = match[2];
  if (grade <= 1) return [];
  return [`${grade - 1}${suffix}`];
}

export default function AdminStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [selectedTahunId, setSelectedTahunId] = useState<string>("");
  const [activeTahunAjaran, setActiveTahunAjaran] = useState<string>("—");
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AKTIF");
  const [kelasFilter, setKelasFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; action: string; msg: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form tambah/edit siswa state
  const [formNis, setFormNis] = useState("");
  const [formNama, setFormNama] = useState("");
  const [formTtl, setFormTtl] = useState("");
  const [formJk, setFormJk] = useState<"L"|"P">("L");
  const [formKelasId, setFormKelasId] = useState("");
  const [formSaving, setFormSaving] = useState(false);

  // Wizard Naik Kelas State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardSourceTahunId, setWizardSourceTahunId] = useState("");
  const [wizardSourceKelasNames, setWizardSourceKelasNames] = useState<string[]>([]);
  const [wizardTargetKelasId, setWizardTargetKelasId] = useState("");
  const [wizardTransitionType, setWizardTransitionType] = useState<"naik_kelas" | "sama_kelas">("naik_kelas");
  const [wizardUncheckedAction, setWizardUncheckedAction] = useState<"tinggal_kelas" | "nonaktif">("tinggal_kelas");
  const [wizardStudents, setWizardStudents] = useState<Student[]>([]);
  const [wizardCheckedIds, setWizardCheckedIds] = useState<number[]>([]);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardSubmitting, setWizardSubmitting] = useState(false);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (selectedTahunId) params.set("tahunAjaranId", selectedTahunId);

    fetch(`/api/admin/students?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStudents(d.students);
          if (d.kelasList) setKelasList(d.kelasList);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [search, statusFilter, selectedTahunId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Muat dropdown pendukung pada saat pertama kali dimuat
  useEffect(() => {
    fetch("/api/admin/academic-years")
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setTahunList(d.data);
          const aktif = d.data.find((t: any) => t.status === "Aktif");
          if (aktif) {
            setSelectedTahunId(String(aktif.id));
            setActiveTahunAjaran(aktif.nama);
          } else if (d.data.length > 0) {
            setSelectedTahunId(String(d.data[0].id));
            setActiveTahunAjaran(d.data[0].nama);
          }
        }
      })
      .catch(console.error);
  }, []);

  const handleTahunChange = (tahunId: string) => {
    setSelectedTahunId(tahunId);
    const selected = tahunList.find((t) => String(t.id) === tahunId);
    if (selected) {
      setActiveTahunAjaran(selected.nama);
    }
  };

  // Filter siswa lokal
  const filtered = students.filter((s) => {
    if (kelasFilter !== "all" && s.kelas !== kelasFilter) return false;
    return true;
  });

  // Cek apakah Spanduk Saran Pintar (Smart Suggestion) harus dimuat
  const activeYearObj = tahunList.find(t => t.status === "Aktif");
  const isSelectedActiveYear = activeYearObj && String(selectedTahunId) === String(activeYearObj.id);
  const showSuggestionBanner = filtered.length === 0 && kelasFilter !== "all" && isSelectedActiveYear && !kelasFilter.startsWith("1");

  const openAdd = () => {
    setEditTarget(null);
    setFormNis(""); setFormNama(""); setFormTtl(""); setFormJk("L"); setFormKelasId("");
    setShowForm(true);
  };

  const openEdit = (s: Student) => {
    setEditTarget(s);
    setFormNis(s.nis); setFormNama(s.nama); setFormTtl(s.ttl); setFormJk(s.jk as "L"|"P");
    setFormKelasId(String(s.kelasId ?? ""));
    setShowForm(true);
    setOpenDropdown(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    try {
      const payload = { nis: formNis, nama: formNama, ttl: formTtl, jk: formJk, kelasId: formKelasId, tahunAjaranId: selectedTahunId };
      const res = await fetch("/api/admin/students", {
        method: editTarget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTarget ? { id: editTarget.id, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(editTarget ? "Data siswa diperbarui" : "Siswa berhasil ditambahkan");
      setShowForm(false);
      fetchData();
    } catch (err: any) { showToast(err.message, "err"); }
    finally { setFormSaving(false); }
  };

  const doAction = async (id: number, action: string) => {
    setActionLoading(true);
    try {
      const url = action === "delete" ? `/api/admin/students?id=${id}` : "/api/admin/students";
      const method = action === "delete" ? "DELETE" : "PUT";
      const body = action === "delete" ? undefined : JSON.stringify({ id, action, tahunAjaranId: selectedTahunId });
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message);
      fetchData();
    } catch (err: any) { showToast(err.message, "err"); }
    finally { setActionLoading(false); setConfirm(null); setOpenDropdown(null); }
  };

  // ── Fungsi Wizard Naik Kelas ──
  const openNaikKelasWizard = (targetClassName: string) => {
    // Cari index selectedTahunId di list desc
    const targetIdx = tahunList.findIndex(t => String(t.id) === String(selectedTahunId));
    const prevYear = targetIdx !== -1 ? tahunList[targetIdx + 1] : tahunList[0];
    const defaultSourceTahunId = prevYear ? String(prevYear.id) : "";
    setWizardSourceTahunId(defaultSourceTahunId);

    // Tentukan default tipe transisi
    const targetTahunObj = tahunList.find(t => String(t.id) === String(selectedTahunId));
    const sourceTahunObj = tahunList.find(t => String(t.id) === String(defaultSourceTahunId));
    let isSame = false;
    if (targetTahunObj && sourceTahunObj) {
      const targetInfo = parseAcademicYear(targetTahunObj.nama);
      const sourceInfo = parseAcademicYear(sourceTahunObj.nama);
      isSame = targetInfo.semester === "Genap" && sourceInfo.semester === "Ganjil";
    }
    const defaultTransitionType = isSame ? "sama_kelas" : "naik_kelas";
    setWizardTransitionType(defaultTransitionType);

    const guessedSources = guessSourceClasses(targetClassName, defaultTransitionType === "sama_kelas");
    setWizardSourceKelasNames(guessedSources);
    
    const targetKelas = kelasList.find(k => k.nama === targetClassName);
    setWizardTargetKelasId(targetKelas ? String(targetKelas.id) : "");

    setWizardUncheckedAction("tinggal_kelas");
    setWizardStudents([]);
    setWizardCheckedIds([]);
    setShowWizard(true);
  };

  // Trigger pencarian siswa asal ketika Kelas Asal / Tahun Asal diubah di Wizard
  useEffect(() => {
    if (showWizard && wizardSourceTahunId && wizardSourceKelasNames.length > 0) {
      setWizardLoading(true);
      const sourceKelasIds = wizardSourceKelasNames
        .map(name => kelasList.find(k => k.nama === name)?.id)
        .filter(Boolean)
        .join(",");
      
      if (!sourceKelasIds) {
        setWizardStudents([]);
        setWizardCheckedIds([]);
        setWizardLoading(false);
        return;
      }

      fetch(`/api/admin/students?tahunAjaranId=${wizardSourceTahunId}&kelasId=${sourceKelasIds}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.students) {
            setWizardStudents(d.students);
            setWizardCheckedIds(d.students.map((s: any) => s.id));
          } else {
            setWizardStudents([]);
            setWizardCheckedIds([]);
          }
        })
        .catch(() => {
          setWizardStudents([]);
          setWizardCheckedIds([]);
        })
        .finally(() => setWizardLoading(false));
    } else if (showWizard && wizardSourceKelasNames.length === 0) {
      setWizardStudents([]);
      setWizardCheckedIds([]);
    }
  }, [showWizard, wizardSourceTahunId, wizardSourceKelasNames, kelasList]);

  // Auto-guess Kelas Asal when Target Class, Transition Type or Source Year changes
  useEffect(() => {
    if (showWizard && wizardTargetKelasId) {
      const targetKelas = kelasList.find(k => String(k.id) === String(wizardTargetKelasId));
      if (targetKelas) {
        const isSame = wizardTransitionType === "sama_kelas";
        const guessed = guessSourceClasses(targetKelas.nama, isSame);
        setWizardSourceKelasNames(guessed);
      }
    }
  }, [showWizard, wizardTargetKelasId, wizardTransitionType]);

  const handleWizardCheckboxChange = (studentId: number) => {
    if (wizardCheckedIds.includes(studentId)) {
      setWizardCheckedIds(wizardCheckedIds.filter(id => id !== studentId));
    } else {
      setWizardCheckedIds([...wizardCheckedIds, studentId]);
    }
  };

  const handleWizardSelectAll = () => {
    if (wizardCheckedIds.length === wizardStudents.length) {
      setWizardCheckedIds([]);
    } else {
      setWizardCheckedIds(wizardStudents.map(s => s.id));
    }
  };

  const handleWizardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wizardStudents.length === 0) return;
    setWizardSubmitting(true);

    const uncheckedSiswaData = wizardStudents
      .filter(s => !wizardCheckedIds.includes(s.id))
      .map(s => ({
        siswaId: s.id,
        sourceKelasId: s.kelasId
      }));

    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "wizard_naik_kelas",
          targetTahunAjaranId: Number(selectedTahunId),
          targetKelasId: Number(wizardTargetKelasId),
          checkedSiswaIds: wizardCheckedIds,
          uncheckedAction: wizardUncheckedAction,
          uncheckedSiswaData: uncheckedSiswaData
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      showToast("Proses penempatan kelas massal berhasil diproses!");
      setShowWizard(false);
      fetchData();
    } catch (err: any) {
      showToast(err.message, "err");
    } finally {
      setWizardSubmitting(false);
    }
  };

  return (
    <Layout role="admin">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Modals: Tambah/Edit */}
      {showForm && (
        <Modal title={editTarget ? "Edit Data Siswa" : "Tambah Siswa Baru"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {[
              { label: "NIS", val: formNis, set: setFormNis, placeholder: "Nomor Induk Siswa" },
              { label: "Nama Lengkap", val: formNama, set: setFormNama, placeholder: "Nama lengkap siswa" },
              { label: "Tempat, Tanggal Lahir", val: formTtl, set: setFormTtl, placeholder: "Jakarta, 01 Januari 2015" },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
                <input value={val} onChange={(e) => set(e.target.value)} placeholder={placeholder} required
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Jenis Kelamin</label>
              <div className="flex gap-3">
                {(["L","P"] as const).map((j) => (
                  <label key={j} className={`flex-1 text-center py-2 border rounded-lg cursor-pointer text-sm font-medium transition-all ${formJk===j ? "border-blue-500 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                    <input type="radio" className="sr-only" checked={formJk===j} onChange={()=>setFormJk(j)} />
                    {j === "L" ? "Laki-laki" : "Perempuan"}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Kelas</label>
              <select value={formKelasId} onChange={(e) => setFormKelasId(e.target.value)} required
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                <option value="">-- Pilih Kelas --</option>
                {kelasList.map((k) => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50">Batal</button>
              <Button type="submit" variant="primary" disabled={formSaving}>
                {formSaving ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</> : "Simpan"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Konfirmasi Aksi */}
      {confirm && (
        <ConfirmModal
          message={confirm.msg}
          onConfirm={() => doAction(confirm.id, confirm.action)}
          onCancel={() => setConfirm(null)}
          loading={actionLoading}
        />
      )}

      {/* Modal: Wizard Naik Kelas Massal */}
      {showWizard && (
        <Modal title="Wizard Kenaikan & Penempatan Kelas" onClose={() => setShowWizard(false)}>
          <form onSubmit={handleWizardSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Tahun Ajaran Asal</label>
                <select value={wizardSourceTahunId} onChange={(e) => setWizardSourceTahunId(e.target.value)}
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 focus:outline-none bg-white">
                  {tahunList.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">Kelas Tujuan Baru</label>
                <select value={wizardTargetKelasId} onChange={(e) => setWizardTargetKelasId(e.target.value)} required
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-xs text-zinc-700 focus:outline-none bg-white">
                  <option value="">-- Pilih Kelas Tujuan --</option>
                  {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Tipe Transisi</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer font-medium">
                  <input type="radio" name="transitionType" value="naik_kelas" checked={wizardTransitionType === "naik_kelas"}
                    onChange={() => setWizardTransitionType("naik_kelas")} className="text-blue-600 focus:ring-blue-500" />
                  Kenaikan Kelas (Naik Tingkat)
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer font-medium">
                  <input type="radio" name="transitionType" value="sama_kelas" checked={wizardTransitionType === "sama_kelas"}
                    onChange={() => setWizardTransitionType("sama_kelas")} className="text-blue-600 focus:ring-blue-500" />
                  Sama Kelas (Mengulang / Semester Baru)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Kelas Asal (Bisa pilih lebih dari satu)</label>
              <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 rounded-xl bg-zinc-50/50">
                {kelasList.map(k => {
                  const isChecked = wizardSourceKelasNames.includes(k.nama);
                  return (
                    <label key={k.id} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer border select-none transition-all ${isChecked ? "bg-blue-600 border-blue-600 text-white shadow-sm" : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => {
                        if (isChecked) {
                          setWizardSourceKelasNames(wizardSourceKelasNames.filter(name => name !== k.nama));
                        } else {
                          setWizardSourceKelasNames([...wizardSourceKelasNames, k.nama]);
                        }
                      }} className="sr-only" />
                      {k.nama}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">Nasib Siswa Tidak Dicentang</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer font-medium">
                  <input type="radio" name="uncheckedAction" value="tinggal_kelas" checked={wizardUncheckedAction === "tinggal_kelas"}
                    onChange={() => setWizardUncheckedAction("tinggal_kelas")} className="text-blue-600 focus:ring-blue-500" />
                  Tinggal Kelas (Mengulang di Kelas Asal)
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer font-medium">
                  <input type="radio" name="uncheckedAction" value="nonaktif" checked={wizardUncheckedAction === "nonaktif"}
                    onChange={() => setWizardUncheckedAction("nonaktif")} className="text-blue-600 focus:ring-blue-500" />
                  Keluar Sekolah / Lulus (Status NONAKTIF)
                </label>
              </div>
            </div>

            {/* Area Tinjau Checklist Siswa */}
            <div className="border border-zinc-100 rounded-xl p-3 bg-zinc-50/50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200/60">
                <span className="text-xs font-bold text-zinc-800">
                  Tinjau Murid ({wizardCheckedIds.length} terpilih dari {wizardStudents.length})
                </span>
                {wizardStudents.length > 0 && (
                  <button type="button" onClick={handleWizardSelectAll}
                    className="text-[10px] font-bold text-blue-600 hover:underline">
                    {wizardCheckedIds.length === wizardStudents.length ? "Hapus Centang Semua" : "Centang Semua"}
                  </button>
                )}
              </div>

              {wizardLoading ? (
                <div className="flex items-center justify-center py-6 gap-2 text-zinc-400">
                  <Loader2 size={16} className="animate-spin text-blue-500" />
                  <span className="text-xs">Memuat daftar murid...</span>
                </div>
              ) : wizardStudents.length === 0 ? (
                <div className="text-center py-6 text-zinc-400 text-xs">
                  Tidak ada siswa di Kelas Asal & Tahun Ajaran terpilih.
                </div>
              ) : (
                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                  {wizardStudents.map(ws => {
                    const isChecked = wizardCheckedIds.includes(ws.id);
                    return (
                      <div key={ws.id} onClick={() => handleWizardCheckboxChange(ws.id)}
                        className="flex items-center justify-between gap-3 px-3 py-2 bg-white border border-zinc-100 rounded-lg cursor-pointer hover:bg-blue-50/20 transition-colors">
                        <div className="flex items-center gap-2">
                          {isChecked ? (
                            <CheckSquare size={16} className="text-blue-600 shrink-0" />
                          ) : (
                            <Square size={16} className="text-zinc-300 shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-zinc-800 leading-tight">{ws.nama}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 border border-zinc-200">{ws.kelas}</span>
                          <span className="text-[10px] font-mono text-zinc-400">{ws.nis}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Keterangan Info Siswa Tinggal Kelas / Kelulusan */}
            {wizardStudents.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 text-xs text-amber-800">
                <Info size={14} className="shrink-0 mt-0.5" />
                <p>
                  Siswa yang <strong>dicentang</strong> akan dipindahkan ke Kelas Tujuan Baru (Tahun Ajaran Terpilih). <br />
                  Siswa yang <strong>tidak dicentang</strong> akan diproses sebagai: <strong>{wizardUncheckedAction === "nonaktif" ? "LULUS / NONAKTIF (Status Nonaktif)" : "TINGGAL KELAS (Mengulang di Kelas Asal masing-masing)"}</strong>.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-zinc-100">
              <button type="button" onClick={() => setShowWizard(false)} className="px-4 py-2 text-sm text-zinc-600 bg-zinc-100 rounded-lg hover:bg-zinc-200">Batal</button>
              <Button type="submit" variant="primary" disabled={wizardSubmitting || wizardStudents.length === 0}>
                {wizardSubmitting ? <><Loader2 size={14} className="animate-spin" /> Memproses...</> : "Proses Kenaikan"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 font-sans">Data Siswa</h1>
          <p className="text-zinc-500 text-sm mt-1">Kelola seluruh data siswa sekolah berdasarkan Tahun Ajaran.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportCSV(filtered, activeTahunAjaran)} className="flex items-center gap-2 px-3 py-2 text-sm border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors font-semibold">
            <Download size={16} /> Excel (CSV)
          </button>
          <button onClick={() => printPDF(filtered, activeTahunAjaran)} className="flex items-center gap-2 px-3 py-2 text-sm border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors font-semibold">
            <Printer size={16} /> Print PDF
          </button>
          {(kelasFilter === "all" ? students.length === 0 : filtered.length === 0) && (
            <Button variant="outline" onClick={() => openNaikKelasWizard(kelasFilter !== "all" ? kelasFilter : "")}>
              <ArrowUpCircle size={16} /> Kenaikan Kelas (Wizard)
            </Button>
          )}
          <Button variant="primary" onClick={openAdd}><Plus size={18} /> Tambah Siswa</Button>
        </div>
      </div>



      {/* Filters Card */}
      <Card className="mb-6 p-4 flex flex-wrap gap-3 items-center shadow-sm">
        {/* Dropdown Tahun Ajaran Utama */}
        <select value={selectedTahunId} onChange={(e) => handleTahunChange(e.target.value)}
          className="border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-blue-800 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-w-[280px]">
          {tahunList.map((t) => (
            <option key={t.id} value={t.id}>
              Tahun Ajaran {t.nama} {t.status === "Aktif" ? "(Aktif)" : ""}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-zinc-200 rounded-lg px-3 py-2 bg-white">
          <Search size={16} className="text-zinc-400" />
          <input type="text" placeholder="Cari nama atau NIS..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm border-none outline-none bg-transparent text-zinc-700 placeholder:text-zinc-400" />
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none bg-white">
          <option value="all">Semua Status</option>
          <option value="AKTIF">Aktif</option>
          <option value="NONAKTIF">Non-Aktif</option>
        </select>

        <select value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none bg-white">
          <option value="all">Semua Kelas</option>
          {kelasList.map((k) => <option key={k.id} value={k.nama}>{k.nama}</option>)}
        </select>

        <span className="text-xs text-zinc-400 ml-auto font-semibold">{filtered.length} siswa</span>
      </Card>

      {/* Table List Card */}
      <Card className="p-0 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-zinc-400">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span className="text-sm">Memuat data...</span>
          </div>
        ) : (
          <TableWrapper>
            <Thead>
              <Tr>
                <Th>Nama Siswa</Th><Th>NIS</Th><Th>Kelas</Th><Th>JK</Th>
                <Th>Orang Tua</Th><Th>Status</Th><Th className="text-right">Aksi</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="text-center py-16 px-4">
                    <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center font-sans">
                      <div className="w-12 h-12 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 mb-3 border border-zinc-100 animate-pulse">
                        <GraduationCap size={22} className="text-blue-500" />
                      </div>
                      {kelasFilter !== "all" ? (
                        <>
                          <h3 className="text-sm font-bold text-zinc-950">Kelas {kelasFilter} Kosong</h3>
                          <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed max-w-sm">
                            Belum ada siswa yang ditempatkan di kelas <strong>{kelasFilter}</strong> untuk Tahun Ajaran <strong>{activeTahunAjaran}</strong>. Silakan gunakan Wizard untuk penempatan kelas.
                          </p>
                          <button
                            type="button"
                            onClick={() => openNaikKelasWizard(kelasFilter)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow cursor-pointer border-none"
                          >
                            <ArrowUpCircle size={15} /> Atur Kenaikan Kelas (Wizard)
                          </button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-sm font-bold text-zinc-950">Belum Ada Siswa</h3>
                          <p className="text-xs text-zinc-500 mt-1 mb-4 leading-relaxed max-w-sm">
                            Tahun Ajaran <strong>{activeTahunAjaran}</strong> belum memiliki siswa terdaftar sama sekali. Silakan gunakan Wizard untuk menyalin dari Tahun Ajaran sebelumnya atau tambah siswa secara manual.
                          </p>
                          <div className="flex gap-2 justify-center">
                            <button
                              type="button"
                              onClick={() => openNaikKelasWizard("")}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-all border border-zinc-200 cursor-pointer"
                            >
                              <ArrowUpCircle size={14} /> Wizard Kenaikan
                            </button>
                            <button
                              type="button"
                              onClick={openAdd}
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm cursor-pointer border-none"
                            >
                              <Plus size={14} /> Tambah Siswa
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </Td>
                </Tr>
              ) : (
                filtered.map((s) => (
                  <Tr key={s.id}>
                    <Td className="font-semibold text-zinc-900 text-sm">{s.nama}</Td>
                    <Td className="text-zinc-500 text-xs font-mono">{s.nis}</Td>
                    <Td className="text-zinc-700 font-medium">{s.kelas}</Td>
                    <Td className="text-zinc-600 text-xs font-semibold">{s.jk === "L" ? "L" : "P"}</Td>
                    <Td className="text-zinc-500 text-sm">{s.ortu}</Td>
                    <Td><StatusBadge status={s.status === "AKTIF" ? "active" : "inactive"} label={s.status} /></Td>
                    <Td className="text-right relative">
                      <button onClick={() => setOpenDropdown(openDropdown === s.id ? null : s.id)}
                        className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 inline-flex transition-colors">
                        <MoreVertical size={18} />
                      </button>
                      {openDropdown === s.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute right-6 top-10 w-44 bg-white rounded-xl shadow-lg border border-zinc-100 z-50 py-1">
                            <button onClick={() => openEdit(s)}
                              className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                              <Edit2 size={15} /> Edit Data
                            </button>
                            <button onClick={() => { setConfirm({ id: s.id, action: "naik_kelas", msg: `Naikkan ${s.nama} ke kelas berikutnya?` }); setOpenDropdown(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2">
                              <ArrowUpCircle size={15} /> Naik Kelas
                            </button>
                            {s.status === "AKTIF" ? (
                              <button onClick={() => { setConfirm({ id: s.id, action: "nonaktif", msg: `Nonaktifkan siswa ${s.nama}?` }); setOpenDropdown(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2">
                                <UserX size={15} /> Nonaktifkan
                              </button>
                            ) : (
                              <button onClick={() => { setConfirm({ id: s.id, action: "aktif", msg: `Aktifkan kembali siswa ${s.nama}?` }); setOpenDropdown(null); }}
                                className="w-full text-left px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2">
                                <UserCheck size={15} /> Aktifkan
                              </button>
                            )}
                            <div className="border-t border-zinc-100 my-1" />
                            <button onClick={() => { setConfirm({ id: s.id, action: "delete", msg: `Hapus permanen siswa "${s.nama}"? Data tidak bisa dikembalikan.` }); setOpenDropdown(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                              <Trash2 size={15} /> Hapus
                            </button>
                          </div>
                        </>
                      )}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </TableWrapper>
        )}
      </Card>
    </Layout>
  );
}
