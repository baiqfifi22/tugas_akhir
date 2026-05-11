import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { Plus, Search, Edit2, Trash2, MoreVertical } from "lucide-react";

interface Student {
  id: number;
  name: string;
  nis: string;
  kelas: string;
  jk: string;
  ortu: string;
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  React.useEffect(() => {
    // TODO: fetch data siswa dari API/Database
  }, []);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.nis.includes(search)
  );

  return (
    <Layout role="admin">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Data Siswa</h1>
          <p className="text-zinc-500">Kelola data siswa seluruh kelas.</p>
        </div>
        <Button variant="primary">
          <Plus size={18} /> Tambah Siswa
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6 p-4">
        <div className="flex items-center gap-3">
          <Search size={18} className="text-zinc-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau NIS..."
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
              <Th>Nama Siswa</Th>
              <Th>NIS</Th>
              <Th>Kelas</Th>
              <Th>JK</Th>
              <Th>Orang Tua</Th>
              <Th className="text-right">Aksi</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filtered.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center py-6 text-zinc-500">
                  Belum ada data siswa.
                </Td>
              </Tr>
            ) : (
              filtered.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-medium text-zinc-900">{s.name}</Td>
                  <Td className="text-zinc-500 text-xs font-mono">{s.nis}</Td>
                  <Td className="text-zinc-600">{s.kelas}</Td>
                  <Td className="text-zinc-600">{s.jk}</Td>
                  <Td className="text-zinc-600">{s.ortu}</Td>
                  <Td className="text-right relative">
                    <button
                      onClick={() => setOpenDropdown(openDropdown === s.id ? null : s.id)}
                      className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100 inline-flex"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openDropdown === s.id && (
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
              ))
            )}
          </Tbody>
        </TableWrapper>
      </Card>
    </Layout>
  );
}
