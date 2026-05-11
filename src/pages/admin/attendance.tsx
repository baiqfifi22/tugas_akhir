import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Download, Calendar, Eye } from "lucide-react";

interface AttendanceSummary {
  date: string;
  cls: string;
  teacher: string;
  total: number;
  hadir: number;
  sakit: number;
  izin: number;
  alpa: number;
  status: string;
}

export default function AdminAttendance() {
  const [dateFilter, setDateFilter] = useState("");
  const [attendanceData, setAttendanceData] = useState<AttendanceSummary[]>([]);

  React.useEffect(() => {
    // TODO: fetch attendance data dari API/Database
  }, [dateFilter]);

  return (
    <Layout role="admin">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Rekap Absensi</h1>
          <p className="text-zinc-500">Data kehadiran seluruh kelas yang dicatat guru.</p>
        </div>
        <Button variant="outline">
          <Download size={18} /> Export Excel
        </Button>
      </div>

      {/* Filter */}
      <Card className="mb-6 p-4 flex flex-col sm:flex-row gap-4 items-center">
        <Calendar size={18} className="text-zinc-400" />
        <span className="text-sm font-medium text-zinc-700">Filter Tanggal:</span>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
        />
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden">
        <TableWrapper>
          <Thead>
            <Tr>
              <Th>Tanggal</Th>
              <Th>Kelas</Th>
              <Th>Guru</Th>
              <Th className="text-center">Hadir</Th>
              <Th className="text-center">Sakit</Th>
              <Th className="text-center">Izin</Th>
              <Th className="text-center">Alpa</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </Tr>
          </Thead>
          <Tbody>
            {attendanceData.length === 0 ? (
              <Tr>
                <Td colSpan={9} className="text-center py-6 text-zinc-500">
                  Belum ada data absensi yang tersedia.
                </Td>
              </Tr>
            ) : (
              attendanceData.map((row, idx) => (
                <Tr key={idx}>
                  <Td className="text-zinc-500">{row.date}</Td>
                  <Td className="font-medium text-zinc-900">{row.cls}</Td>
                  <Td className="text-zinc-600">{row.teacher}</Td>
                  <Td className="text-center font-medium text-emerald-600">{row.hadir}</Td>
                  <Td className="text-center text-yellow-600">{row.sakit}</Td>
                  <Td className="text-center text-blue-600">{row.izin}</Td>
                  <Td className="text-center text-red-600">{row.alpa}</Td>
                  <Td>
                    <StatusBadge
                      status={row.status === "Submitted" ? "active" : "inactive"}
                      label={row.status === "Submitted" ? "Disimpan" : "Draft"}
                    />
                  </Td>
                  <Td className="text-right">
                    <button className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100 inline-flex">
                      <Eye size={18} />
                    </button>
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
