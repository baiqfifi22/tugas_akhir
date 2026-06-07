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
  Printer, PowerOff, Power, Loader2, X, AlertCircle, CheckCircle2,
  ClipboardList, Trash, BookOpen,
} from "lucide-react";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ADMIN"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface Assignment {
  id: number;
  kelasId: number;
  kelasNama: string;
  mataPelajaran: string;
}

interface Teacher {
  id: number; nip: string; nama: string; email: string;
  noHp: string; role: string; status: string; kelas: string; mapel: string;
  activeAssignments: Assignment[];
}

interface Kelas { id: number; nama: string; }
interface TahunAjaran { id: number; nama: string; isActive: boolean; }

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS = ["WALI_KELAS", "GURU_MAPEL", "KEPALA_SEKOLAH"];
const ROLE_LABELS: Record<string, string> = {
  WALI_KELAS: "Wali Kelas", GURU_MAPEL: "Guru Mapel", KEPALA_SEKOLAH: "Kepala Sekolah",
};
const MAPEL_OPTIONS = [
  { value: "QURAN_HADIST", label: "Quran Hadist" },
  { value: "FIQIH", label: "Fiqih" },
  { value: "SKI", label: "SKI" },
  { value: "AKIDAH_AKHLAK", label: "Akidah Akhlak" },
  { value: "B_ARAB", label: "B. Arab" },
  { value: "BAHASA_INGGRIS", label: "Bahasa Inggris" },
  { value: "PJOK", label: "PJOK" },
  { value: "MATA_PELAJARAN_WAJIB", label: "Mata Pelajaran Wajib" },
];
function mapelLabel(val: string) {
  return MAPEL_OPTIONS.find((m) => m.value === val)?.label ?? val.replace(/_/g, " ");
}

// ─── Print via hidden iframe ──────────────────────────────────────────────────
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

function exportCSV(data: Teacher[], tahunAjaran: string) {
  const safeNama = tahunAjaran.replace(/[^a-zA-Z0-9]/g, "");
  const BOM = "\uFEFF";
  const metaRows = `"Tahun Ajaran: ${tahunAjaran}"\n"Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}"\n\n`;
  const header = "No,NIP,Nama,Email,No HP,Role,Kelas (TA Aktif),Mata Pelajaran (TA Aktif),Status\n";
  const rows = data
    .map((t, i) => `${i + 1},"${t.nip}","${t.nama}","${t.email}","${t.noHp}","${ROLE_LABELS[t.role] || t.role}","${t.kelas}","${t.mapel}","${t.status}"`)
    .join("\n");
  const blob = new Blob([BOM + metaRows + header + rows], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `data_guru_${safeNama}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printPDF(data: Teacher[], tahunAjaran: string) {
  const content = `
    <html><head><title>Data Guru</title>
    <style>
      body{font-family:Arial;font-size:11px;margin:20px}
      h2{margin-bottom:4px} h3{margin:0 0 8px;color:#555;font-weight:normal;font-size:10px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:5px 8px}
      th{background:#f0f0f0}
      tr:nth-child(even){background:#fafafa}
    </style>
    </head><body>
    <h2>Data Guru &mdash; MI Integral Buah Hati Insani</h2>
    <h3>Tahun Ajaran: ${tahunAjaran} &nbsp;|&nbsp; Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</h3>
    <table>
      <tr><th>No</th><th>NIP</th><th>Nama</th><th>Role</th><th>Kelas</th><th>Mapel</th><th>Status</th></tr>
      ${data.map((t, i) => `<tr><td>${i + 1}</td><td>${t.nip}</td><td>${t.nama}</td><td>${ROLE_LABELS[t.role] || t.role}</td><td>${t.kelas}</td><td>${t.mapel}</td><td>${t.status}</td></tr>`).join("")}
    </table></body></html>`;
  printInPage(content);
}

// ─── Modal Wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-xl w-full z-10 max-h-[90vh] overflow-y-auto ${wide ? "max-w-3xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
          <h3 className="font-bold text-zinc-900">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors"><X size={20} /></button>
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
          <button onClick={onCancel} className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50">Batal</button>
          <button onClick={onConfirm} disabled={loading} className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 flex items-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />} Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Penugasan TA per Guru ──────────────────────────────────────────────
function PenugasanModal({
  guru, kelasList, tahunAktifNama, onClose, showToast,
}: {
  guru: Teacher;
  kelasList: Kelas[];
  tahunAktifNama: string | null;
  onClose: () => void;
  showToast: (msg: string, type?: "ok" | "err") => void;
}) {
  const [assignments, setAssignments] = useState<Assignment[]>(guru.activeAssignments);
  const [newKelasId, setNewKelasId] = useState("");
  const [newMapel, setNewMapel] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  const handleAdd = async () => {
    if (!newKelasId || !newMapel) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/guru-tahun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guruId: guru.id, kelasId: Number(newKelasId), mataPelajaran: newMapel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAssignments((prev) => [
        ...prev,
        {
          id: data.data.id,
          kelasId: Number(newKelasId),
          kelasNama: kelasList.find((k) => k.id === Number(newKelasId))?.nama ?? "",
          mataPelajaran: newMapel,
        },
      ]);
      setNewKelasId("");
      setNewMapel("");
      showToast("Penugasan ditambahkan.");
    } catch (err: any) {
      showToast(err.message, "err");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/guru-tahun?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      showToast("Penugasan dihapus.");
    } catch (err: any) {
      showToast(err.message, "err");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Modal title={`Penugasan: ${guru.nama}`} onClose={onClose}>
      {tahunAktifNama ? (
        <div className="mb-4 inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full">
          <ClipboardList size={12} />
          TA Aktif: {tahunAktifNama}
        </div>
      ) : (
        <div className="mb-4 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠️ Tidak ada tahun ajaran aktif. Aktifkan tahun ajaran terlebih dahulu.
        </div>
      )}

      <div className="mb-4">
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Penugasan Saat Ini</p>
        {assignments.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-4 bg-zinc-50 rounded-lg">
            Belum ada penugasan untuk tahun ajaran ini.
          </p>
        ) : (
          <div className="space-y-1.5">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2 group">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-zinc-700 bg-white border border-zinc-200 px-2 py-0.5 rounded">
                    {a.kelasNama}
                  </span>
                  <span className="text-xs text-zinc-600">{mapelLabel(a.mataPelajaran)}</span>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  disabled={deleting === a.id}
                  className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash size={14} />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {tahunAktifNama && (
        <div className="border-t border-zinc-100 pt-4">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Tambah Penugasan</p>
          <div className="flex gap-2">
            <select
              value={newKelasId}
              onChange={(e) => setNewKelasId(e.target.value)}
              className="flex-1 border border-zinc-200 rounded-lg px-2 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Kelas</option>
              {kelasList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <select
              value={newMapel}
              onChange={(e) => setNewMapel(e.target.value)}
              className="flex-1 border border-zinc-200 rounded-lg px-2 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">Mapel</option>
              {MAPEL_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              disabled={!newKelasId || !newMapel || adding}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {adding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Tambah
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
        >
          Tutup
        </button>
      </div>
    </Modal>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTeachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [kelasList, setKelasList] = useState<Kelas[]>([]);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [selectedTahunId, setSelectedTahunId] = useState<string>("");
  const [tahunAktifId, setTahunAktifId] = useState<number | null>(null);
  const [tahunAktifNama, setTahunAktifNama] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("AKTIF");
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Teacher | null>(null);
  const [confirm, setConfirm] = useState<{ id: number; action: string; msg: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [penugasanTarget, setPenugasanTarget] = useState<Teacher | null>(null);

  // Form state
  const [fNip, setFNip] = useState(""); const [fNama, setFNama] = useState("");
  const [fEmail, setFEmail] = useState(""); const [fNoHp, setFNoHp] = useState("");
  const [fPassword, setFPassword] = useState(""); const [fRole, setFRole] = useState("GURU_MAPEL");
  const [formSaving, setFormSaving] = useState(false);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(() => {
    setIsLoading(true);
    const p = new URLSearchParams();
    if (search) p.set("search", search);
    if (statusFilter !== "all") p.set("status", statusFilter);
    if (selectedTahunId) p.set("tahunAjaranId", selectedTahunId);
    fetch(`/api/admin/teachers?${p}`).then(r => r.json())
      .then(d => {
        if (d.success) {
          setTeachers(d.teachers);
          if (d.kelasList) setKelasList(d.kelasList);
          if (d.tahunAktifNama !== undefined) setTahunAktifNama(d.tahunAktifNama);
          if (d.tahunAktifId !== undefined) setTahunAktifId(d.tahunAktifId);
          if (d.tahunList) {
            setTahunList(d.tahunList);
            // Inisialisasi selectedTahunId ke TA aktif jika belum di-set
            if (!selectedTahunId && d.tahunAktifId) {
              setSelectedTahunId(String(d.tahunAktifId));
            }
          }
        }
      })
      .catch(console.error).finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, selectedTahunId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => {
    setEditTarget(null);
    setFNip(""); setFNama(""); setFEmail(""); setFNoHp(""); setFPassword(""); setFRole("GURU_MAPEL");
    setShowForm(true);
  };

  const openEdit = (t: Teacher) => {
    setEditTarget(t);
    setFNip(t.nip); setFNama(t.nama); setFEmail(t.email); setFNoHp(t.noHp); setFPassword(""); setFRole(t.role);
    setShowForm(true); setOpenDropdown(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormSaving(true);
    try {
      const payload = { nip: fNip, nama: fNama, email: fEmail, noHp: fNoHp, role: fRole, ...(fPassword ? { password: fPassword } : {}) };
      const res = await fetch("/api/admin/teachers", {
        method: editTarget ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTarget ? { id: editTarget.id, ...payload } : payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(editTarget ? "Data guru diperbarui" : "Guru berhasil ditambahkan");
      setShowForm(false); fetchData();
    } catch (err: any) { showToast(err.message, "err"); }
    finally { setFormSaving(false); }
  };

  const doAction = async (id: number, action: string) => {
    setActionLoading(true);
    try {
      const url = action === "delete" ? `/api/admin/teachers?id=${id}` : "/api/admin/teachers";
      const method = action === "delete" ? "DELETE" : "PUT";
      const body = action === "delete" ? undefined : JSON.stringify({ id, action });
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(data.message); fetchData();
    } catch (err: any) { showToast(err.message, "err"); }
    finally { setActionLoading(false); setConfirm(null); setOpenDropdown(null); }
  };

  // Hitung statistik penugasan di tahun yang dipilih
  const guruSudahDitugaskan = teachers.filter((t) => t.activeAssignments.length > 0).length;
  const selectedTahunNama = tahunList.find((t) => String(t.id) === selectedTahunId)?.nama ?? tahunAktifNama ?? "—";
  const isViewingAktif = tahunList.find((t) => String(t.id) === selectedTahunId)?.isActive ?? false;

  return (
    <Layout role="admin">
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.type === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
          {toast.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />} {toast.msg}
        </div>
      )}

      {/* Modal Form Guru */}
      {showForm && (
        <Modal title={editTarget ? "Edit Data Guru" : "Tambah Guru Baru"} onClose={() => setShowForm(false)}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {[
              { label: "NIP", val: fNip, set: setFNip, placeholder: "Nomor Induk Pegawai" },
              { label: "Nama Lengkap", val: fNama, set: setFNama, placeholder: "Nama lengkap guru" },
              { label: "Email", val: fEmail, set: setFEmail, placeholder: "email@sekolah.sch.id" },
              { label: "No. HP", val: fNoHp, set: setFNoHp, placeholder: "08xxxxxxxxxx" },
            ].map(({ label, val, set, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
                <input value={val} onChange={e => set(e.target.value)} placeholder={placeholder} required
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                Password {editTarget && <span className="text-zinc-400 font-normal">(kosongkan jika tidak diubah)</span>}
              </label>
              <input value={fPassword} onChange={e => setFPassword(e.target.value)} type="password" placeholder="Password login" required={!editTarget}
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
              <select value={fRole} onChange={e => setFRole(e.target.value)} required
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
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

      {/* Modal Konfirmasi */}
      {confirm && (
        <ConfirmModal message={confirm.msg} onConfirm={() => doAction(confirm.id, confirm.action)} onCancel={() => setConfirm(null)} loading={actionLoading} />
      )}

      {/* Modal Penugasan per Guru */}
      {penugasanTarget && (
        <PenugasanModal
          guru={penugasanTarget}
          kelasList={kelasList}
          tahunAktifNama={tahunAktifNama}
          onClose={() => { setPenugasanTarget(null); fetchData(); }}
          showToast={showToast}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Data Guru</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Kelola data guru dan penugasan mengajar
            {selectedTahunNama && <span className="ml-1 text-blue-600 font-medium">— TA {selectedTahunNama}</span>}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportCSV(teachers, selectedTahunNama ?? "—")} className="flex items-center gap-2 px-3 py-2 text-sm border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors">
            <Download size={16} /> Excel (CSV)
          </button>
          <button onClick={() => printPDF(teachers, selectedTahunNama ?? "—")} className="flex items-center gap-2 px-3 py-2 text-sm border border-zinc-200 rounded-lg text-zinc-600 hover:bg-zinc-50 transition-colors">
            <Printer size={16} /> Print PDF
          </button>
          <Button variant="primary" onClick={openAdd}><Plus size={18} /> Tambah Guru</Button>
        </div>
      </div>

      {/* Progress bar singkat */}
      {isViewingAktif && (
        <div className="mb-4 flex items-center gap-3 bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
          <BookOpen size={16} className="text-violet-500 shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-violet-800">Guru Ditugaskan di TA Aktif</span>
              <span className="text-xs font-bold text-violet-700">{guruSudahDitugaskan} / {teachers.length}</span>
            </div>
            <div className="w-full h-1.5 bg-violet-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: teachers.length > 0 ? `${(guruSudahDitugaskan / teachers.length) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 p-4 flex flex-wrap gap-3 items-center">
        {/* Dropdown Tahun Ajaran */}
        <select
          value={selectedTahunId}
          onChange={(e) => setSelectedTahunId(e.target.value)}
          className="border border-blue-200 rounded-lg px-3 py-2 text-sm font-bold text-blue-800 bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {tahunList.map((t) => (
            <option key={t.id} value={t.id}>
              TA {t.nama}{t.isActive ? " (Aktif)" : ""}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-zinc-400" />
          <input type="text" placeholder="Cari nama atau NIP..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm border-none outline-none bg-transparent text-zinc-700 placeholder:text-zinc-400" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          <option value="all">Semua Status</option>
          <option value="AKTIF">Aktif</option>
          <option value="NONAKTIF">Non-Aktif</option>
        </select>
        <span className="text-xs text-zinc-400 ml-auto">{teachers.length} guru</span>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-zinc-400">
            <Loader2 size={24} className="animate-spin text-blue-500" /><span className="text-sm">Memuat data...</span>
          </div>
        ) : (
          <TableWrapper>
            <Thead>
              <Tr>
                <Th>Nama Guru</Th><Th>NIP</Th><Th>Role</Th>
                <Th>Kelas</Th><Th>Mata Pelajaran</Th>
                <Th>Status</Th><Th className="text-right">Aksi</Th>
              </Tr>
            </Thead>
            <Tbody>
              {teachers.length === 0 ? (
                <Tr><Td colSpan={7} className="text-center py-10 text-zinc-400">Tidak ada data guru.</Td></Tr>
              ) : (
                teachers.map((t) => (
                  <Tr key={t.id}>
                    <Td>
                      <div className="font-medium text-zinc-900">{t.nama}</div>
                      <div className="text-xs text-zinc-400">{t.email}</div>
                    </Td>
                    <Td className="text-zinc-500 text-xs font-mono">{t.nip}</Td>
                    <Td className="text-zinc-600 text-sm">{ROLE_LABELS[t.role] || t.role}</Td>
                    <Td className="text-zinc-500 text-sm">
                      {t.kelas === "—" ? (
                        <span className="text-xs text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">Belum ditugaskan</span>
                      ) : t.kelas}
                    </Td>
                    <Td className="text-zinc-500 text-xs">
                      {t.mapel === "—" ? "—" : t.mapel.split(", ").map(m => mapelLabel(m)).join(", ")}
                    </Td>
                    <Td><StatusBadge status={t.status === "AKTIF" ? "active" : "inactive"} label={t.status} /></Td>
                    <Td className="text-right relative">
                      <button onClick={() => setOpenDropdown(openDropdown === t.id ? null : t.id)}
                        className="text-zinc-400 hover:text-zinc-600 p-1 rounded-md hover:bg-zinc-100 inline-flex transition-colors">
                        <MoreVertical size={18} />
                      </button>
                      {openDropdown === t.id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                          <div className="absolute right-6 top-10 w-52 bg-white rounded-xl shadow-lg border border-zinc-100 z-50 py-1">
                            <button onClick={() => openEdit(t)} className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2">
                              <Edit2 size={15} /> Edit Data Guru
                            </button>
                            <button
                              onClick={() => { setPenugasanTarget(t); setOpenDropdown(null); }}
                              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                            >
                              <ClipboardList size={15} /> Penugasan TA Aktif
                            </button>
                            <button onClick={() => { setConfirm({ id: t.id, action: "toggle_status", msg: `${t.status === "AKTIF" ? "Nonaktifkan" : "Aktifkan"} guru ${t.nama}?` }); setOpenDropdown(null); }}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${t.status === "AKTIF" ? "text-orange-600 hover:bg-orange-50" : "text-emerald-600 hover:bg-emerald-50"}`}>
                              {t.status === "AKTIF" ? <><PowerOff size={15} /> Nonaktifkan</> : <><Power size={15} /> Aktifkan</>}
                            </button>
                            <div className="border-t border-zinc-100 my-1" />
                            <button onClick={() => { setConfirm({ id: t.id, action: "delete", msg: `Hapus guru ${t.nama}?` }); setOpenDropdown(null); }}
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
