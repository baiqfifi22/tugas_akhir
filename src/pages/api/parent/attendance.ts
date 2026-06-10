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
    const { month, full, today, view } = req.query;

    const tahunAktif = await prisma.tahunAjaran.findFirst({
      where: { isActive: true }
    });

    if (!tahunAktif) {
      return res.status(404).json({ message: "Tahun ajaran aktif tidak ditemukan" });
    }

    // Build date range filter
    let startDate: Date;
    let endDate: Date;

    if (full === "true") {
      startDate = new Date(tahunAktif.mulai);
      endDate = new Date(tahunAktif.selesai);
    } else if (view === "bulan" && typeof month === "string" && /^\d{4}-\d{2}$/.test(month)) {
      const [year, mon] = month.split("-").map(Number);
      startDate = new Date(year, mon - 1, 1);
      endDate = new Date(year, mon, 0, 23, 59, 59, 999);
    } else {
      // Default: "tahun" (Seluruh Tahun Ajaran Aktif)
      startDate = new Date(tahunAktif.mulai);
      endDate = new Date(tahunAktif.selesai);
    }

    // List of months in active academic year
    const availableMonths: { value: string; label: string }[] = [];
    const current = new Date(tahunAktif.mulai);
    current.setDate(1);
    const endLimit = new Date(tahunAktif.selesai);
    let loopCount = 0;
    while (current <= endLimit && loopCount < 100) {
      loopCount++;
      const year = current.getFullYear();
      const monthNum = current.getMonth() + 1;
      const value = `${year}-${String(monthNum).padStart(2, "0")}`;
      const label = current.toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
      availableMonths.push({ value, label });
      current.setMonth(current.getMonth() + 1);
    }

    // Ambil semua absensi siswa dalam rentang waktu
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

    // Statistik hanya menghitung mata pelajaran wajib
    const wajibAbsensiList = absensiList.filter(
      (a) => a.sesi.mataPelajaran === "MATA_PELAJARAN_WAJIB"
    );

    const stats = {
      hadir: wajibAbsensiList.filter((a) => a.status === "HADIR").length,
      sakit: wajibAbsensiList.filter((a) => a.status === "SAKIT").length,
      izin: wajibAbsensiList.filter((a) => a.status === "IZIN").length,
      alpa: wajibAbsensiList.filter((a) => a.status === "ALPA").length,
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

    // Query data absensi hari ini (berdasarkan tanggal lokal client jika ada, jika tidak server)
    let localTodayStr: string;
    if (typeof today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(today)) {
      localTodayStr = today;
    } else {
      const nowLocalDate = new Date();
      const localYear = nowLocalDate.getFullYear();
      const localMonth = String(nowLocalDate.getMonth() + 1).padStart(2, "0");
      const localDay = String(nowLocalDate.getDate()).padStart(2, "0");
      localTodayStr = `${localYear}-${localMonth}-${localDay}`;
    }
    const todayStart = new Date(`${localTodayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${localTodayStr}T23:59:59.999Z`);

    const todayAbsensiList = await prisma.absensi.findMany({
      where: {
        siswaId: siswa.id,
        sesi: {
          tanggal: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      },
      include: {
        sesi: true,
      },
      orderBy: {
        sesi: { tanggal: "desc" },
      },
    });

    const todayAttendance = todayAbsensiList.map((a) => {
      const status =
        a.status === "HADIR"
          ? "Hadir"
          : a.status === "SAKIT"
          ? "Sakit"
          : a.status === "IZIN"
          ? "Izin"
          : "Alpa";

      return {
        date: a.sesi.tanggal.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        day: DAYS_ID[a.sesi.tanggal.getDay()],
        status,
        note: a.sesi.notes || "—",
        mapel: a.sesi.mataPelajaran,
      };
    });

    return res.status(200).json({
      success: true,
      childName: siswa.nama,
      childNis: siswa.nis,
      attendanceData,
      todayAttendance,
      stats,
      report,
      availableMonths,
      academicYearName: tahunAktif.nama,
    });
  } catch (error) {
    console.error("API /parent/attendance Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
