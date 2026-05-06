import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { Calendar, UserCheck, UserX, Clock, CalendarDays, FileText, User } from "lucide-react";

// Mock Data
const MOCK_DATA = [
  { date: "14 Apr 2026", day: "Senin", status: "Hadir", note: "—" },
  { date: "13 Apr 2026", day: "Jumat", status: "Hadir", note: "—" },
  { date: "12 Apr 2026", day: "Kamis", status: "Sakit", note: "Demam" },
  { date: "11 Apr 2026", day: "Rabu", status: "Hadir", note: "—" },
  { date: "10 Apr 2026", day: "Selasa", status: "Hadir", note: "—" },
  { date: "9 Apr 2026", day: "Senin", status: "Izin", note: "Acara keluarga" },
  { date: "8 Apr 2026", day: "Jumat", status: "Hadir", note: "—" },
];

const MOCK_MONTHLY_STATS = {
  hadir: 20,
  sakit: 1,
  izin: 1,
  alpa: 0,
};

const MOCK_NARRATIVE_REPORT = {
  period: "April 2026",
  teacher: "Budi Santoso, S.Pd",
  notes: "Deni menunjukkan peningkatan kedisiplinan yang baik bulan ini. Partisipasi di kelas juga semakin aktif. Mohon untuk tetap menjaga kesehatan agar kehadiran tetap optimal."
};

export default function ParentAttendance() {
  const [monthFilter, setMonthFilter] = useState("2026-04");

  const getStatusStyle = (status: string) => {
    if (status === "Hadir") return "bg-emerald-100 text-emerald-800";
    if (status === "Sakit") return "bg-yellow-100 text-yellow-800";
    if (status === "Izin") return "bg-blue-100 text-blue-800";
    if (status === "Alpa") return "bg-red-100 text-red-800";
    return "bg-zinc-100 text-zinc-600";
  };

  return (
    <Layout role="parent">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Rekap Kehadiran & Laporan</h1>
          <p className="text-zinc-500">Pantau kehadiran dan perkembangan anak (Deni Hidayat).</p>
        </div>
      </div>

      {/* Filter */}
      <Card className="mb-6 p-4 flex flex-col sm:flex-row gap-4 items-center bg-blue-50/50 border-blue-100">
        <Calendar size={18} className="text-blue-600" />
        <span className="text-sm font-bold text-zinc-900">Pilih Bulan:</span>
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="border border-blue-200 rounded-lg px-3 py-2 text-sm text-zinc-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors bg-white shadow-sm"
        />
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card interactive className="border-t-4 border-t-emerald-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hadir</p>
              <h3 className="text-2xl font-black text-zinc-900">{MOCK_MONTHLY_STATS.hadir}</h3>
            </div>
          </div>
        </Card>
        <Card interactive className="border-t-4 border-t-yellow-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-yellow-50 text-yellow-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sakit</p>
              <h3 className="text-2xl font-black text-zinc-900">{MOCK_MONTHLY_STATS.sakit}</h3>
            </div>
          </div>
        </Card>
        <Card interactive className="border-t-4 border-t-blue-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Izin</p>
              <h3 className="text-2xl font-black text-zinc-900">{MOCK_MONTHLY_STATS.izin}</h3>
            </div>
          </div>
        </Card>
        <Card interactive className="border-t-4 border-t-red-500">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <UserX size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Alpa</p>
              <h3 className="text-2xl font-black text-zinc-900">{MOCK_MONTHLY_STATS.alpa}</h3>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table List */}
        <div className="lg:col-span-2">
          <Card className="p-0 overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-zinc-200 bg-white">
              <h2 className="text-lg font-bold text-zinc-900">Detail Kehadiran Bulan Ini</h2>
            </div>
            <TableWrapper>
              <Thead>
                <Tr>
                  <Th>Tanggal</Th>
                  <Th>Hari</Th>
                  <Th>Status</Th>
                  <Th>Keterangan</Th>
                </Tr>
              </Thead>
              <Tbody>
                {MOCK_DATA.map((row, idx) => (
                  <Tr key={idx}>
                    <Td className="text-zinc-500">{row.date}</Td>
                    <Td className="font-medium text-zinc-900">{row.day}</Td>
                    <Td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusStyle(row.status)}`}>
                        {row.status}
                      </span>
                    </Td>
                    <Td className="text-zinc-500">{row.note}</Td>
                  </Tr>
                ))}
              </Tbody>
            </TableWrapper>
          </Card>
        </div>

        {/* Narrative Report */}
        <div className="lg:col-span-1">
          <Card className="h-full bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-blue-100/50">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 leading-tight">Laporan Perkembangan</h2>
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">{MOCK_NARRATIVE_REPORT.period}</p>
              </div>
            </div>
            
            <div className="relative">
              <span className="text-4xl text-blue-200 absolute -top-4 -left-2 font-serif">"</span>
              <p className="text-sm text-zinc-700 leading-relaxed relative z-10 pl-4 italic">
                {MOCK_NARRATIVE_REPORT.notes}
              </p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
                <User size={14} />
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Ditulis oleh Wali Kelas</p>
                <p className="text-sm font-bold text-zinc-900">{MOCK_NARRATIVE_REPORT.teacher}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

