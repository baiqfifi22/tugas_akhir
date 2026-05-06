import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Plus, Search, Edit2, Trash2, MoreVertical } from "lucide-react";

const MOCK_TEACHERS = [
  { id: 1, name: "Budi Santoso, S.Pd", nip: "198503152010011023", mapel: "Matematika", kelas: "10-A", status: "Aktif" },
  { id: 2, name: "Siti Rahma, S.Pd", nip: "199001202015032001", mapel: "B. Inggris", kelas: "10-B", status: "Aktif" },
  { id: 3, name: "Ahmad Dahlan, S.Si", nip: "198708112012011003", mapel: "Fisika", kelas: "11 IPA", status: "Aktif" },
  { id: 4, name: "Dewi Sartika, S.Pd", nip: "199205302018032002", mapel: "Sosiologi", kelas: "11 IPS", status: "Cuti" },
  { id: 5, name: "Dian Sastro, S.Pd", nip: "198812252014032001", mapel: "Biologi", kelas: "12-A", status: "Aktif" },
];

export default function AdminTeachers() {
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  const filtered = MOCK_TEACHERS.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.nip.includes(search)
  );

  return (
    <Layout role="admin">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Data Guru</h1>
          <p className="text-zinc-500">Kelola data guru dan wali kelas.</p>
        </div>
        <Button variant="primary">
          <Plus size={18} /> Tambah Guru
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-3">
          <Search size={18} className="text-zinc-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau NIP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm border-none outline-none bg-transparent text-zinc-700 placeholder:text-zinc-400"
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <TableWrapper>
          <Thead>
            <Tr>
              <Th>Nama Guru</Th>
              <Th>NIP</Th>
              <Th>Mata Pelajaran</Th>
              <Th>Kelas</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.map((t) => (
              <Tr key={t.id}>
                <Td className="font-medium text-zinc-900">{t.name}</Td>
                <Td className="text-zinc-500 text-xs font-mono">{t.nip}</Td>
                <Td className="text-zinc-600">{t.mapel}</Td>
                <Td className="text-zinc-600">{t.kelas}</Td>
                <Td>
                  <StatusBadge status={t.status === "Aktif" ? "active" : "warning"} label={t.status} />
                </Td>
                <Td className="text-right relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === t.id ? null : t.id)}
                    className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100 inline-flex"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {openDropdown === t.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                      <div className="absolute right-6 top-10 w-36 bg-white rounded-lg shadow-lg border border-zinc-100 z-50 py-1">
                        <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors">
                          <Edit2 size={16} /> Edit
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                          <Trash2 size={16} /> Hapus
                        </button>
                      </div>
                    </>
                  )}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </TableWrapper>
      </Card>
    </Layout>
  );
}
