import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const auth = requireApiRole(req, res, ["ADMIN"]);
  if (!auth) return;

  try {
    const { scope = "weekly" } = req.query;

    // Gunakan offset UTC+8 (WIB/WITA) agar "hari ini" di server
    // konsisten dengan tanggal lokal pengguna yang dikirim dari browser.
    // Tanggal absensi disimpan sebagai YYYY-MM-DDT00:00:00.000Z (UTC midnight
    // dari tanggal lokal pengguna), sehingga server harus query dengan UTC yang sama.
    const WIB_OFFSET_MS = 8 * 60 * 60 * 1000; // UTC+8
    const now = new Date();
    const localNow = new Date(now.getTime() + WIB_OFFSET_MS);
    const year = localNow.getUTCFullYear();
    const month = String(localNow.getUTCMonth() + 1).padStart(2, "0");
    const day = String(localNow.getUTCDate()).padStart(2, "0");
    const localTodayStr = `${year}-${month}-${day}`;
    const todayStart = new Date(`${localTodayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${localTodayStr}T23:59:59.999Z`);

    // Cari tahun ajaran aktif untuk filter dashboard
    const tahunAktifDashboard = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    });

    const [totalGuru, totalSiswa, totalKelas, totalSesiHariIni] = await Promise.all([
      // Hitung guru unik yang mengajar di tahun ajaran aktif
      tahunAktifDashboard
        ? prisma.guruTahun.findMany({
            where: { tahunAjaranId: tahunAktifDashboard.id },
            select: { guruId: true },
            distinct: ["guruId"],
          }).then((rows) => rows.length)
        : prisma.guru.count({ where: { status: "AKTIF" } }),
      // Hitung siswa unik yang terdaftar di tahun ajaran aktif
      tahunAktifDashboard
        ? prisma.siswaKelas.findMany({
            where: { tahunAjaranId: tahunAktifDashboard.id },
            select: { siswaId: true },
            distinct: ["siswaId"],
          }).then((rows) => rows.length)
        : prisma.siswa.count({ where: { status: "AKTIF" } }),
      // Total kelas tetap global (kelas tidak terikat tahun ajaran)
      prisma.kelas.count(),
      prisma.sesiAbsensi.count({
        where: {
          tanggal: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      }),
    ]);

    // Ambil semua kelas aktif
    const classes = await prisma.kelas.findMany({
      orderBy: { nama: "asc" },
    });

    // Cari kelas unik yang sudah melakukan absensi hari ini
    const uniqueSesiHariIni = await prisma.sesiAbsensi.findMany({
      where: {
        tanggal: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      select: {
        kelasId: true,
      },
      distinct: ["kelasId"],
    });

    const totalKelasAbsenHariIni = uniqueSesiHariIni.length;

    // Filter kelas yang belum absen hari ini
    const kelasBelumAbsen = classes
      .filter((c) => !uniqueSesiHariIni.some((us) => us.kelasId === c.id))
      .map((c) => c.nama);

    // Tentukan range tanggal berdasarkan scope
    let startDate = new Date();
    let endDate = new Date();

    if (scope === "weekly") {
      startDate.setDate(startDate.getDate() - 6);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);
    } else if (scope === "monthly") {
      startDate.setDate(startDate.getDate() - 29);
      startDate.setUTCHours(0, 0, 0, 0);
      endDate.setUTCHours(23, 59, 59, 999);
    } else if (scope === "yearly") {
      const activeYear = await prisma.tahunAjaran.findFirst({
        where: { isActive: true },
      });
      if (activeYear) {
        startDate = new Date(activeYear.mulai);
        endDate = new Date(activeYear.selesai);
      } else {
        // Fallback 12 bulan terakhir
        startDate.setMonth(startDate.getMonth() - 11);
        startDate.setDate(1);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate.setUTCHours(23, 59, 59, 999);
      }
    }

    // Ambil data absensi dalam range tanggal tersebut
    const sessions = await prisma.sesiAbsensi.findMany({
      where: {
        tanggal: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        tanggal: true,
        absensi: {
          select: {
            status: true,
          },
        },
      },
    });

    // Bangun data grafik berdasarkan scope
    const chartData = [];

    if (scope === "yearly") {
      const current = new Date(startDate);
      current.setDate(1);
      current.setUTCHours(0, 0, 0, 0);
      const limit = new Date(endDate);

      while (current <= limit) {
        const year = current.getFullYear();
        const month = current.getMonth();

        const monthSessions = sessions.filter((s) => {
          const d = new Date(s.tanggal);
          return d.getFullYear() === year && d.getMonth() === month;
        });

        let hadir = 0;
        let absen = 0;
        for (const s of monthSessions) {
          for (const a of s.absensi) {
            if (a.status === "HADIR") hadir++;
            else absen++;
          }
        }

        chartData.push({
          label: current.toLocaleDateString("id-ID", { month: "short", year: "numeric" }),
          hadir,
          absen,
        });

        current.setMonth(current.getMonth() + 1);
      }
    } else {
      const tempDate = new Date(startDate);
      while (tempDate <= endDate) {
        const dayStart = new Date(tempDate); dayStart.setUTCHours(0, 0, 0, 0);
        const dayEnd = new Date(tempDate); dayEnd.setUTCHours(23, 59, 59, 999);

        const daySessions = sessions.filter(
          (s) => s.tanggal >= dayStart && s.tanggal <= dayEnd
        );

        let hadir = 0;
        let absen = 0;
        for (const s of daySessions) {
          for (const a of s.absensi) {
            if (a.status === "HADIR") hadir++;
            else absen++;
          }
        }

        chartData.push({
          label: tempDate.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            weekday: scope === "weekly" ? "short" : undefined,
          }),
          hadir,
          absen,
        });

        tempDate.setDate(tempDate.getDate() + 1);
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        totalGuru,
        totalSiswa,
        totalKelas,
        totalSesiHariIni,
        totalKelasAbsenHariIni,
      },
      kelasBelumAbsen,
      chartData,
    });
  } catch (error) {
    console.error("API /admin/dashboard Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
