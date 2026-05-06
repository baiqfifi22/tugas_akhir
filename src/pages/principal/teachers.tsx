import React from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Mail, Phone } from "lucide-react";

const MOCK_TEACHERS = [
  { name: "Budi Santoso, S.Pd", nip: "198503152010011023", kelas: "10-A", mapel: "Matematika", email: "budi@sekolah.sch.id", phone: "0812xxxx1234", status: "Aktif" },
  { name: "Siti Rahma, S.Pd", nip: "199001202015032001", kelas: "10-B", mapel: "Bahasa Inggris", email: "siti@sekolah.sch.id", phone: "0813xxxx5678", status: "Aktif" },
  { name: "Ahmad Dahlan, S.Si", nip: "198708112012011003", kelas: "11 IPA", mapel: "Fisika", email: "ahmad@sekolah.sch.id", phone: "0857xxxx9012", status: "Aktif" },
  { name: "Dewi Sartika, S.Pd", nip: "199205302018032002", kelas: "11 IPS", mapel: "Sosiologi", email: "dewi@sekolah.sch.id", phone: "0878xxxx3456", status: "Cuti" },
  { name: "Dian Sastro, S.Pd", nip: "198812252014032001", kelas: "12-A", mapel: "Biologi", email: "dian@sekolah.sch.id", phone: "0821xxxx7890", status: "Aktif" },
];

export default function PrincipalTeachers() {
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
            {MOCK_TEACHERS.map((t, idx) => (
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
            ))}
          </Tbody>
        </TableWrapper>
      </Card>
    </Layout>
  );
}
