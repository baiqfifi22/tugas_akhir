import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const auth = requireApiRole(req, res, ["ORANG_TUA"]);
  if (!auth) return;

  try {
    const orangTuaId = parseInt(auth.userId, 10);

    // Cari orang tua beserta data siswa
    const orangTua = await prisma.orangTua.findUnique({
      where: { id: orangTuaId },
      include: { siswa: true },
    });

    if (!orangTua) {
      return res.status(404).json({ message: "Data orang tua tidak ditemukan" });
    }

    const siswa = orangTua.siswa;
    const { month } = req.query; // format: "2026-04"

    // Build date range filter
    let startDate: Date;
    let endDate: Date;

    if (month && typeof month === "string") {
      const [year, mon] = month.split("-").map(Number);
      startDate = new Date(year, mon - 1, 1);
      endDate = new Date(year, mon, 0, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Ambil semua absensi siswa dalam rentang bulan
    const absensiList = await prisma.absensi.findMany({
      where: {
        siswaId: siswa.id,
        sesi: {
          tanggal: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        sesi: {
          include: {
            guru: true,
            kelas: true,
          },
        },
      },
      orderBy: {
        sesi: { tanggal: "desc" },
      },
    });

    const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    const attendanceData = absensiList.map((a) => {
      const tgl = a.sesi.tanggal;
      const status =
        a.status === "HADIR"
          ? "Hadir"
          : a.status === "SAKIT"
          ? "Sakit"
          : a.status === "IZIN"
          ? "Izin"
          : "Alpa";

      return {
        date: tgl.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        day: DAYS_ID[tgl.getDay()],
        status,
        note: a.sesi.notes || "—",
        mapel: a.sesi.mataPelajaran,
      };
    });

    // Summary stats
    const stats = {
      hadir: absensiList.filter((a) => a.status === "HADIR").length,
      sakit: absensiList.filter((a) => a.status === "SAKIT").length,
      izin: absensiList.filter((a) => a.status === "IZIN").length,
      alpa: absensiList.filter((a) => a.status === "ALPA").length,
    };

    // Ambil laporan terbaru dari guru untuk siswa ini di bulan ini
    const laporan = await prisma.laporan.findFirst({
      where: {
        siswaId: siswa.id,
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: { guru: true },
      orderBy: { tanggal: "desc" },
    });

    const report = laporan
      ? {
          period: laporan.tanggal.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          }),
          teacher: laporan.guru.nama,
          notes: laporan.uraian,
        }
      : null;

    return res.status(200).json({
      success: true,
      childName: siswa.nama,
      childNis: siswa.nis,
      attendanceData,
      stats,
      report,
    });
  } catch (error) {
    console.error("API /parent/attendance Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
