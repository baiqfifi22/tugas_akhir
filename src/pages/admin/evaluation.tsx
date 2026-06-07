import React, { useState, useEffect, useCallback } from "react";
import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  TableWrapper, Thead, Th, Tbody, Tr, Td,
} from "@/components/ui/Table";
import {
  Plus, Calendar, Loader2, Trash2, Pencil, X, Check,
  ClipboardList, Users, Clock, BarChart2, AlertCircle,
} from "lucide-react";
import { useRouter } from "next/router";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ADMIN"]);
  if ("redirect" in auth) return auth;
  return { props: {} };
};

interface Periode {
  id: number;
  tahunAjaranId: number;
  tahunAjaran: string;
  mulai: string;
  selesai: string;
  status: "AKAN_DATANG" | "AKTIF" | "SELESAI";
  jumlahSubmit: number;
}

interface TahunAjaran {
  id: number;
  nama: string;
  status: string;
}

const STATUS_CONFIG = {
  AKTIF: { label: "Aktif", class: "bg-green-100 text-green-800" },
  AKAN_DATANG: { label: "Akan Datang", class: "bg-zinc-100 text-zinc-600" },
  SELESAI: { label: "Selesai", class: "bg-blue-100 text-blue-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function toInputDate(iso: string) {
  return iso.slice(0, 10);
}

export default function AdminEvaluation() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"periode" | "soal">("periode");
  const [periodeList, setPeriodeList] = useState<Periode[]>([]);
  const [tahunList, setTahunList] = useState<TahunAjaran[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Form state
  const [form, setForm] = useState({
    tahunAjaranId: "",
    mulai: "",
    selesai: "",
  });

  const fetchData = useCallback(() => {
    setIsLoading(true);
    fetch("/api/admin/evaluation")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPeriodeList(d.data);
          setTahunList(d.tahunList);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenForm = (periode?: Periode) => {
    setError("");
    if (periode) {
      setEditId(periode.id);
      setForm({
        tahunAjaranId: String(periode.tahunAjaranId),
        mulai: toInputDate(periode.mulai),
        selesai: toInputDate(periode.selesai),
      });
    } else {
      setEditId(null);
      setForm({ tahunAjaranId: "", mulai: "", selesai: "" });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditId(null);
    setError("");
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const url = "/api/admin/evaluation";
      const method = editId ? "PATCH" : "POST";
      const body = editId
        ? { id: editId, mulai: form.mulai, selesai: form.selesai }
        : { tahunAjaranId: Number(form.tahunAjaranId), mulai: form.mulai, selesai: form.selesai };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Terjadi kesalahan");
        return;
      }

      handleCloseForm();
      fetchData();
    } catch {
      setError("Gagal menghubungi server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus periode ini?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/evaluation?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Gagal menghapus");
        return;
      }
      fetchData();
    } catch {
      alert("Gagal menghubungi server");
    } finally {
      setDeletingId(null);
    }
  };

  // Summary stats
  const totalAktif = periodeList.filter((p) => p.status === "AKTIF").length;
  const totalSubmit = periodeList.reduce((s, p) => s + p.jumlahSubmit, 0);

  return (
    <Layout role="admin">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Manajemen Evaluasi</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Kelola periode pembukaan evaluasi serta daftar soal/aspek penilaian secara dinamis.
          </p>
        </div>
        {activeTab === "periode" && (
          <Button variant="primary" onClick={() => handleOpenForm()}>
            <Plus size={16} />
            Buka Periode Baru
          </Button>
        )}
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-zinc-200 mb-6">
        <button
          onClick={() => setActiveTab("periode")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "periode"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          📅 Periode Evaluasi
        </button>
        <button
          onClick={() => setActiveTab("soal")}
          className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${
            activeTab === "soal"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-zinc-500 hover:text-zinc-700"
          }`}
        >
          📝 Soal/Aspek Penilaian
        </button>
      </div>

      {activeTab === "periode" ? (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Periode", value: periodeList.length, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Periode Aktif", value: totalAktif, icon: Clock, color: "text-green-600", bg: "bg-green-50" },
              { label: "Total Submit", value: totalSubmit, icon: Users, color: "text-violet-600", bg: "bg-violet-50" },
            ].map((s) => (
              <Card key={s.label}>
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-full ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                    <s.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{s.label}</p>
                    <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

      {/* Form Tambah/Edit Periode */}
      {showForm && (
        <Card className="mb-6 border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-zinc-900 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              {editId ? "Edit Periode Evaluasi" : "Buka Periode Evaluasi Baru"}
            </h2>
            <button
              onClick={handleCloseForm}
              className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmitForm} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!editId && (
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Tahun Ajaran <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.tahunAjaranId}
                  onChange={(e) => setForm((f) => ({ ...f, tahunAjaranId: e.target.value }))}
                  required
                  className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="">Pilih Tahun Ajaran</option>
                  {tahunList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama} {t.status === "Aktif" ? "(Aktif)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Tanggal Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.mulai}
                onChange={(e) => setForm((f) => ({ ...f, mulai: e.target.value }))}
                required
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Tanggal Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.selesai}
                onChange={(e) => setForm((f) => ({ ...f, selesai: e.target.value }))}
                required
                className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              />
            </div>

            <div className={`flex items-end gap-2 ${!editId ? "" : "sm:col-span-3"}`}>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-60 text-sm font-medium"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                {editId ? "Simpan Perubahan" : "Buat Periode"}
              </button>
              <button
                type="button"
                onClick={handleCloseForm}
                className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-50 transition text-sm font-medium"
              >
                Batal
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Tabel Periode */}
      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
            <Loader2 size={24} className="animate-spin text-blue-500" />
            <span className="text-sm">Memuat data...</span>
          </div>
        ) : periodeList.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-500">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Belum ada periode evaluasi</p>
            <p className="text-sm text-zinc-400 mt-1">Klik "Buka Periode Baru" untuk memulai</p>
          </div>
        ) : (
          <TableWrapper>
            <Thead>
              <Tr>
                <Th>Tahun Ajaran</Th>
                <Th>Tanggal Mulai</Th>
                <Th>Tanggal Selesai</Th>
                <Th className="text-center">Status</Th>
                <Th className="text-center">Jumlah Submit</Th>
                <Th className="text-center">Aksi</Th>
              </Tr>
            </Thead>
            <Tbody>
              {periodeList.map((p) => {
                const cfg = STATUS_CONFIG[p.status];
                return (
                  <Tr key={p.id}>
                    <Td className="font-medium text-zinc-900">{p.tahunAjaran}</Td>
                    <Td className="text-zinc-500 text-sm">{formatDate(p.mulai)}</Td>
                    <Td className="text-zinc-500 text-sm">{formatDate(p.selesai)}</Td>
                    <Td className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.class}`}>
                        {cfg.label}
                      </span>
                    </Td>
                    <Td className="text-center font-bold text-zinc-700">{p.jumlahSubmit}</Td>
                    <Td>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => router.push(`/admin/evaluation-recap?periodeId=${p.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                        >
                          <BarChart2 size={13} />
                          Rekap
                        </button>
                        <button
                          onClick={() => handleOpenForm(p)}
                          className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100"
                          title="Edit tanggal"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="text-zinc-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 disabled:opacity-50"
                          title="Hapus periode"
                        >
                          {deletingId === p.id ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </TableWrapper>
        )}
      </Card>
      </>
      ) : (
        <QuestionManager />
      )}
    </Layout>
  );
}

// ── Sub-component: QuestionManager ──────────────────────────────────────────
interface AspekEvaluasi {
  id: number;
  tipe: "SEKOLAH" | "GURU";
  teks: string;
  aktif: boolean;
  tanggal: string;
}

function QuestionManager() {
  const [questions, setQuestions] = useState<AspekEvaluasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teks, setTeks] = useState("");
  const [tipe, setTipe] = useState<"SEKOLAH" | "GURU">("SEKOLAH");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingTeks, setEditingTeks] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const fetchQuestions = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/evaluation-questions")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setQuestions(d.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teks.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/evaluation-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipe, teks }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTeks("");
        showToast("Soal berhasil ditambahkan!");
        fetchQuestions();
      } else {
        showToast(data.message || "Gagal menambahkan soal", "err");
      }
    } catch {
      showToast("Gagal menghubungkan ke server", "err");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAktif = async (q: AspekEvaluasi) => {
    try {
      const res = await fetch("/api/admin/evaluation-questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: q.id, aktif: !q.aktif }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Soal berhasil ${!q.aktif ? "diaktifkan" : "dinonaktifkan"}`);
        fetchQuestions();
      } else {
        showToast(data.message || "Gagal memperbarui status", "err");
      }
    } catch {
      showToast("Gagal menghubungkan ke server", "err");
    }
  };

  const handleStartEdit = (q: AspekEvaluasi) => {
    setEditingId(q.id);
    setEditingTeks(q.teks);
  };

  const handleSaveEdit = async (id: number) => {
    if (!editingTeks.trim()) return;
    try {
      const res = await fetch("/api/admin/evaluation-questions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, teks: editingTeks }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEditingId(null);
        showToast("Soal berhasil diperbarui!");
        fetchQuestions();
      } else {
        showToast(data.message || "Gagal memperbarui soal", "err");
      }
    } catch {
      showToast("Gagal menghubungkan ke server", "err");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus atau menonaktifkan soal ini?")) return;
    try {
      const res = await fetch(`/api/admin/evaluation-questions?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        fetchQuestions();
      } else {
        showToast(data.message || "Gagal menghapus", "err");
      }
    } catch {
      showToast("Gagal menghubungkan ke server", "err");
    }
  };

  const filtered = questions.filter(q => q.teks.toLowerCase().includes(search.toLowerCase()));
  const sekolahQuestions = filtered.filter((q) => q.tipe === "SEKOLAH");
  const guruQuestions = filtered.filter((q) => q.tipe === "GURU");

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg text-sm font-medium transition-all ${
          toast.type === "ok" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "ok" ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Add question form Card */}
      <Card className="border-blue-100 bg-blue-50/20">
        <h2 className="font-bold text-zinc-900 mb-4 flex items-center gap-2 text-sm">
          <Plus size={16} className="text-blue-600" /> Tambah Pertanyaan / Aspek Baru
        </h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={tipe}
              onChange={(e) => setTipe(e.target.value as "SEKOLAH" | "GURU")}
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white h-10"
            >
              <option value="SEKOLAH">Evaluasi Sekolah</option>
              <option value="GURU">Evaluasi Guru</option>
            </select>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              placeholder="Masukkan teks aspek evaluasi (contoh: Kebersihan & Keamanan)..."
              required
              className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white h-10"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-60 text-sm font-semibold h-10 shrink-0"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Tambah
          </button>
        </form>
      </Card>

      {/* Search and Columns list */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-zinc-100 rounded-xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-zinc-600">Daftar Aspek/Pertanyaan</p>
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aspek..."
            className="w-full border border-zinc-200 rounded-lg px-3 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Evaluasi Sekolah Column */}
        <Card className="p-0 overflow-hidden">
          <div className="bg-blue-50/50 border-b border-zinc-100 px-5 py-3.5 flex items-center justify-between">
            <h3 className="font-bold text-zinc-800 text-sm">🏫 Evaluasi Sekolah</h3>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {sekolahQuestions.length} aspek
            </span>
          </div>

          <div className="divide-y divide-zinc-100 min-h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
                <Loader2 size={20} className="animate-spin text-blue-500" />
                <span className="text-xs">Memuat data...</span>
              </div>
            ) : sekolahQuestions.length === 0 ? (
              <div className="p-10 text-center text-zinc-400 text-xs">
                {search ? "Hasil pencarian kosong." : "Belum ada pertanyaan sekolah. Sistem akan menggunakan data statis bawaan."}
              </div>
            ) : (
              sekolahQuestions.map((q) => (
                <div key={q.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/30 transition-colors">
                  <div className="flex-1">
                    {editingId === q.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTeks}
                          onChange={(e) => setEditingTeks(e.target.value)}
                          className="flex-1 border border-zinc-200 rounded-lg px-3 py-1 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <button onClick={() => handleSaveEdit(q.id)} className="bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 transition">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="bg-zinc-100 border border-zinc-200 text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-200 transition">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${q.aktif ? "text-zinc-800" : "text-zinc-400 line-through font-light"}`}>{q.teks}</span>
                        {!q.aktif && <span className="bg-zinc-100 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded font-medium">Nonaktif</span>}
                      </div>
                    )}
                  </div>
                  {editingId !== q.id && (
                    <div className="flex items-center gap-1.5">
                      {/* Active/Inactive switch */}
                      <button
                        onClick={() => handleToggleAktif(q)}
                        className={`text-xs px-2.5 py-1 rounded-md transition font-semibold ${
                          q.aktif
                            ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                            : "bg-zinc-50 text-zinc-500 border border-zinc-200 hover:bg-zinc-100"
                        }`}
                        title={q.aktif ? "Nonaktifkan pertanyaan" : "Aktifkan pertanyaan"}
                      >
                        {q.aktif ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => handleStartEdit(q)}
                        className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-md transition"
                        title="Edit teks"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition"
                        title="Hapus / Deaktifkan soal secara aman"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Evaluasi Guru Column */}
        <Card className="p-0 overflow-hidden">
          <div className="bg-violet-50/50 border-b border-zinc-100 px-5 py-3.5 flex items-center justify-between">
            <h3 className="font-bold text-zinc-800 text-sm">👨‍🏫 Evaluasi Guru</h3>
            <span className="bg-violet-100 text-violet-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {guruQuestions.length} aspek
            </span>
          </div>

          <div className="divide-y divide-zinc-100 min-h-[250px]">
            {loading ? (
              <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
                <Loader2 size={20} className="animate-spin text-blue-500" />
                <span className="text-xs">Memuat data...</span>
              </div>
            ) : guruQuestions.length === 0 ? (
              <div className="p-10 text-center text-zinc-400 text-xs">
                {search ? "Hasil pencarian kosong." : "Belum ada pertanyaan guru. Sistem akan menggunakan data statis bawaan."}
              </div>
            ) : (
              guruQuestions.map((q) => (
                <div key={q.id} className="p-4 flex items-center justify-between gap-4 hover:bg-zinc-50/30 transition-colors">
                  <div className="flex-1">
                    {editingId === q.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTeks}
                          onChange={(e) => setEditingTeks(e.target.value)}
                          className="flex-1 border border-zinc-200 rounded-lg px-3 py-1 text-sm text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                        <button onClick={() => handleSaveEdit(q.id)} className="bg-green-600 text-white p-1.5 rounded-lg hover:bg-green-700 transition">
                          <Check size={14} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="bg-zinc-100 border border-zinc-200 text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-200 transition">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${q.aktif ? "text-zinc-800" : "text-zinc-400 line-through font-light"}`}>{q.teks}</span>
                        {!q.aktif && <span className="bg-zinc-100 text-zinc-400 text-[10px] px-1.5 py-0.5 rounded font-medium">Nonaktif</span>}
                      </div>
                    )}
                  </div>
                  {editingId !== q.id && (
                    <div className="flex items-center gap-1.5">
                      {/* Active/Inactive switch */}
                      <button
                        onClick={() => handleToggleAktif(q)}
                        className={`text-xs px-2.5 py-1 rounded-md transition font-semibold ${
                          q.aktif
                            ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                            : "bg-zinc-50 text-zinc-500 border border-zinc-200 hover:bg-zinc-100"
                        }`}
                        title={q.aktif ? "Nonaktifkan pertanyaan" : "Aktifkan pertanyaan"}
                      >
                        {q.aktif ? "Aktif" : "Nonaktif"}
                      </button>
                      <button
                        onClick={() => handleStartEdit(q)}
                        className="text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 p-1.5 rounded-md transition"
                        title="Edit teks"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition"
                        title="Hapus / Deaktifkan soal secara aman"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
