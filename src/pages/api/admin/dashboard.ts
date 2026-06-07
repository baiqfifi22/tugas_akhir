import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const auth = requireApiRole(req, res, ["ADMIN"]);
  if (!auth) return;

  try {
    const [totalGuru, totalSiswa, totalKelas, totalSesiHariIni] = await Promise.all([
      prisma.guru.count({ where: { status: "AKTIF" } }),
      prisma.siswa.count({ where: { status: "AKTIF" } }),
      prisma.kelas.count(),
      prisma.sesiAbsensi.count({
        where: {
          tanggal: {
            gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
            lte: new Date(new Date().setUTCHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

    // 10 sesi absensi terbaru
    const recentSesi = await prisma.sesiAbsensi.findMany({
      take: 10,
      orderBy: { tanggal: "desc" },
      include: {
        guru: true,
        kelas: true,
        absensi: true,
      },
    });

    const logs = recentSesi.map((s) => ({
      id: s.id,
      date: s.tanggal.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
      cls: s.kelas.nama,
      teacher: s.guru.nama,
      subject: s.mataPelajaran,
      present: s.absensi.filter((a) => a.status === "HADIR").length,
      absent: s.absensi.filter((a) => a.status !== "HADIR").length,
      total: s.absensi.length,
    }));

    // Grafik kehadiran 7 hari terakhir
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d); dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setUTCHours(23, 59, 59, 999);

      const sesiList = await prisma.sesiAbsensi.findMany({
        where: { tanggal: { gte: dayStart, lte: dayEnd } },
        include: { absensi: true },
      });

      const hadir = sesiList.reduce((sum, s) => sum + s.absensi.filter((a) => a.status === "HADIR").length, 0);
      const absen = sesiList.reduce((sum, s) => sum + s.absensi.filter((a) => a.status !== "HADIR").length, 0);

      chartData.push({
        label: d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" }),
        hadir,
        absen,
      });
    }

    return res.status(200).json({
      success: true,
      stats: { totalGuru, totalSiswa, totalKelas, totalSesiHariIni },
      logs,
      chartData,
    });
  } catch (error) {
    console.error("API /admin/dashboard Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
