import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TableWrapper, Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Download, MoreVertical, Users, UserCheck, UserX, Clock, Edit2, Trash2, ChevronDown } from "lucide-react";

import { LucideIcon } from "lucide-react";

interface DashboardStat {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface AttendanceLog {
  id: number;
  date: string;
  cls: string;
  teacher: string;
  subject: string;
  present: number;
  absent: number;
  status: string;
}

export default function AdminDashboard() {
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);

  React.useEffect(() => {
    // TODO: fetch stats and logs dari database
  }, []);

  const toggleDropdown = (id: number) => {
    if (openDropdown === id) setOpenDropdown(null);
    else setOpenDropdown(id);
  };

  return (
    <Layout role="admin">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard Utama</h1>
          <p className="text-zinc-500">Ringkasan kehadiran siswa sekolah hari ini.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
             Filter <ChevronDown size={16} />
          </Button>
          <Button variant="primary">
            <Download size={18} />
            Export Laporan
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.length === 0 ? (
          <div className="col-span-4 text-center py-8 text-zinc-500 bg-white rounded-2xl border border-zinc-200">
            Memuat statistik...
          </div>
        ) : (
          stats.map((stat, idx) => (
            <Card key={idx} interactive>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-500">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-zinc-900">{stat.value}</h3>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center bg-white">
          <h2 className="text-lg font-bold text-zinc-900">Riwayat Absensi Terbaru</h2>
        </div>
        <TableWrapper>
          <Thead>
            <Tr>
              <Th>Kelas & Guru</Th>
              <Th>Mata Pelajaran</Th>
              <Th>Kehadiran</Th>
              <Th>Status</Th>
              <Th className="text-right">Aksi</Th>
            </Tr>
          </Thead>
          <Tbody>
            {logs.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center py-6 text-zinc-500">Belum ada riwayat absensi.</Td>
              </Tr>
            ) : (
              logs.map((log) => (
                <Tr key={log.id}>
                  <Td>
                    <div className="font-medium text-zinc-900">Kelas {log.cls}</div>
                    <div className="text-xs text-zinc-500">{log.teacher}</div>
                  </Td>
                  <Td className="text-zinc-600">{log.subject}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-emerald-600 font-medium">{log.present} Hadir</span>
                      <span className="text-zinc-300">|</span>
                      <span className="text-sm text-red-600 font-medium">{log.absent} Absen</span>
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge 
                      status={log.status === "Submitted" ? "active" : "inactive"} 
                      label={log.status === "Submitted" ? "Disimpan" : "Draft"} 
                    />
                  </Td>
                  <Td className="text-right relative">
                    <button 
                      onClick={() => toggleDropdown(log.id)}
                      className="text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100 inline-flex"
                    >
                      <MoreVertical size={18} />
                    </button>
                    
                    {openDropdown === log.id && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                        <div className="absolute right-6 top-10 w-36 bg-white rounded-lg shadow-lg border border-zinc-100 z-50 py-1">
                          <button className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors">
                            <Edit2 size={16} /> Edit Data
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
