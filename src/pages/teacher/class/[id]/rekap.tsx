import React, { useState } from "react";
import { useRouter } from "next/router";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { Download, ClipboardCheck, BarChart2, Calendar, FileSpreadsheet } from "lucide-react";

export default function ClassRekap() {
  const router = useRouter();
  const { id } = router.query;
  const classId = typeof id === "string" ? id : "10-a";

  const [dateFilter, setDateFilter] = useState("");

  const summaryData = [
    { name: "Ahmad Budi", mon: "H", tue: "H", wed: "H", thu: "I", fri: "H" },
    { name: "Siti Aminah", mon: "H", tue: "H", wed: "H", thu: "H", fri: "H" },
    { name: "Rina Kusuma", mon: "S", tue: "H", wed: "H", thu: "H", fri: "H" },
    { name: "Deni Hidayat", mon: "H", tue: "H", wed: "A", thu: "H", fri: "H" }
  ];

  const getStatusColor = (status: string) => {
    if (status === "H") return "text-emerald-600 bg-emerald-50";
    if (status === "S") return "text-yellow-600 bg-yellow-50";
    if (status === "I") return "text-blue-600 bg-blue-50";
    if (status === "A") return "text-red-600 bg-red-50";
    return "";
  };

  return (
    <Layout role="teacher" hasSidebar={true}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Rekap Kehadiran - Kelas {classId.toUpperCase()}</h1>
          <p className="text-zinc-500">Memonitor kehadiran siswa dalam periode tertentu.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download size={18} /> Export Excel
          </Button>
        </div>
      </div>

      {/* Filter & Actions */}
      <Card className="mb-8 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-sm font-medium text-zinc-700">Filter Tanggal:</span>
          <input 
            type="week" 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
          />
        </div>
        <Button variant="primary">
          <FileSpreadsheet size={18} /> Generate Laporan
        </Button>
      </Card>

      {/* Chart View */}
      <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <BarChart2 size={18} className="text-blue-600" />
        Statistik Kehadiran (Bulan Ini)
      </h2>
      <Card className="mb-8 h-64 flex items-end gap-4 p-6 justify-between pt-16 relative">
        <div className="absolute top-6 left-6 text-sm font-medium text-zinc-500">Rataan Kehadiran Perminggu (%)</div>
        {/* Dummy Bars */}
        {[85, 90, 75, 95].map((val, idx) => (
          <div key={idx} className="w-full bg-zinc-100 rounded-t-lg relative h-full flex items-end">
            <div 
              style={{ height: `${val}%` }} 
              className="w-full bg-blue-500 hover:bg-blue-600 transition-colors rounded-t-lg"
            ></div>
            <div className="absolute -bottom-6 w-full text-center text-xs text-zinc-500">Minggu {idx + 1}</div>
            <div className="absolute top-0 w-full text-center text-sm font-bold text-blue-600" style={{ transform: "translateY(-100%)", top: `${100 - val}%` }}>
              {val}%
            </div>
          </div>
        ))}
      </Card>

      {/* Table Detail Mingguan */}
      <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2 mt-8">
        <Calendar size={18} className="text-blue-600" />
        Detail Mingguan Siswa
      </h2>
      <Card className="p-0 overflow-hidden">
        <TableWrapper>
          <Thead>
            <Tr>
              <Th>Nama Siswa</Th>
              <Th className="text-center">Senin</Th>
              <Th className="text-center">Selasa</Th>
              <Th className="text-center">Rabu</Th>
              <Th className="text-center">Kamis</Th>
              <Th className="text-center">Jumat</Th>
            </Tr>
          </Thead>
          <Tbody>
            {summaryData.map((data, idx) => (
              <Tr key={idx}>
                <Td className="font-medium text-zinc-900">{data.name}</Td>
                {['mon', 'tue', 'wed', 'thu', 'fri'].map(day => (
                  <Td key={day} className="text-center">
                    <span className={`inline-flex w-8 h-8 items-center justify-center rounded-md font-bold text-xs ${getStatusColor(data[day as keyof typeof data])}`}>
                      {data[day as keyof typeof data]}
                    </span>
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </TableWrapper>
      </Card>

    </Layout>
  );
}
