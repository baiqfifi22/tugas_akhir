import React from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Mail, Phone } from "lucide-react";

interface TeacherData {
  name: string;
  nip: string;
  kelas: string;
  mapel: string;
  email: string;
  phone: string;
  status: string;
}

export default function PrincipalTeachers() {
  const [teachers, setTeachers] = React.useState<TeacherData[]>([]);

  React.useEffect(() => {
    // TODO: fetch data guru dari database
  }, []);

  return (
    <Layout role="principal">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Data Guru</h1>
        <p className="text-zinc-500">Daftar guru pengajar dan wali kelas.</p>
      </div>

      <Card className="p-0 overflow-hidden">
        <TableWrapper>
          <Thead>
            <Tr>
              <Th>Nama Guru</Th>
              <Th>NIP</Th>
              <Th>Kelas</Th>
              <Th>Mapel</Th>
              <Th>Kontak</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {teachers.length === 0 ? (
              <Tr>
                <Td colSpan={6} className="text-center py-6 text-zinc-500">
                  Belum ada data guru.
                </Td>
              </Tr>
            ) : (
              teachers.map((t, idx) => (
                <Tr key={idx}>
                  <Td className="font-medium text-zinc-900">{t.name}</Td>
                  <Td className="text-zinc-500 text-xs font-mono">{t.nip}</Td>
                  <Td className="text-zinc-600">{t.kelas}</Td>
                  <Td className="text-zinc-600">{t.mapel}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <a href={`mailto:${t.email}`} className="text-zinc-400 hover:text-blue-600 transition-colors"><Mail size={16} /></a>
                      <a href={`tel:${t.phone}`} className="text-zinc-400 hover:text-blue-600 transition-colors"><Phone size={16} /></a>
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={t.status === "Aktif" ? "active" : "warning"} label={t.status} />
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
