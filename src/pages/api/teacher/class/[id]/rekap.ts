import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

// Parse format "YYYY-Www" menjadi range Senin–Minggu
function parseWeekRange(weekStr: string): { start: Date; end: Date } {
  // weekStr: "2026-W20"
  const [yearStr, weekPart] = weekStr.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekPart, 10);

  // Hitung tanggal Senin dari ISO week number
  const jan4 = new Date(year, 0, 4); // 4 Jan selalu di week 1
  const startOfYear = new Date(jan4);
  startOfYear.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7)); // Mundur ke Senin

  const monday = new Date(startOfYear);
  monday.setDate(startOfYear.getDate() + (week - 1) * 7);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const auth = requireApiRole(req, res, ["GURU", "KEPALA_SEKOLAH"]);
  if (!auth) return;

  try {
    const { id, week } = req.query;
    const kelasId = parseInt(id as string, 10);

    if (isNaN(kelasId)) {
      return res.status(400).json({ message: "kelasId tidak valid" });
    }

    // Default: minggu ini
    const weekStr =
      (week as string) || getISOWeek(new Date());
    const { start, end } = parseWeekRange(weekStr);

    const tahunAktif = await prisma.tahunAjaran.findFirst({
      where: { isActive: true }
    });

    // Ambil semua siswa di kelas ini
    const siswaKelas = await prisma.siswaKelas.findMany({
      where: { kelasId, tahunAjaranId: tahunAktif?.id },
      include: { siswa: true, kelas: true },
    });

    const kelasNama = siswaKelas.length > 0 ? siswaKelas[0].kelas.nama : String(kelasId);

    // Ambil semua sesi absensi dalam rentang minggu untuk kelas ini
    const sesiList = await prisma.sesiAbsensi.findMany({
      where: {
        kelasId,
        tanggal: { gte: start, lte: end },
      },
      include: {
        absensi: true,
      },
      orderBy: { tanggal: "asc" },
    });

    // Buat map: siswaId -> { dayIndex (0=Mon..4=Fri) -> status }
    const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

    const studentMap = new Map<
      number,
      { name: string; days: Record<string, string> }
    >();

    siswaKelas.forEach(({ siswa }) => {
      studentMap.set(siswa.id, {
        name: siswa.nama,
        days: { mon: "-", tue: "-", wed: "-", thu: "-", fri: "-" },
      });
    });

    // Isi status dari setiap sesi
    sesiList.forEach((sesi) => {
      const jsDay = sesi.tanggal.getDay(); // 0=Sun, 1=Mon ... 6=Sat
      // Konversi ke index 0=Mon, 4=Fri
      const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
      const dayKey = DAY_KEYS[dayIdx];

      if (!["mon", "tue", "wed", "thu", "fri"].includes(dayKey)) return;

      sesi.absensi.forEach((ab) => {
        const student = studentMap.get(ab.siswaId);
        if (student) {
          const statusCode =
            ab.status === "HADIR"
              ? "H"
              : ab.status === "SAKIT"
              ? "S"
              : ab.status === "IZIN"
              ? "I"
              : "A";
          student.days[dayKey] = statusCode;
        }
      });
    });

    // Format output
    const summaryData = Array.from(studentMap.values()).map((s) => ({
      name: s.name,
      ...s.days,
    }));

    // Hitung persentase hadir per hari
    const totalSiswa = siswaKelas.length;
    const dailyStats: Record<string, number> = { mon: 0, tue: 0, wed: 0, thu: 0, fri: 0 };

    summaryData.forEach((row) => {
      DAY_KEYS.slice(0, 5).forEach((day) => {
        if ((row as any)[day] === "H") dailyStats[day]++;
      });
    });

    const dailyPercent = Object.fromEntries(
      Object.entries(dailyStats).map(([day, count]) => [
        day,
        totalSiswa > 0 ? Math.round((count / totalSiswa) * 100) : 0,
      ])
    );

    // Hitung summary hari ini
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setUTCHours(23, 59, 59, 999);

    const sesiHariIni = await prisma.sesiAbsensi.findFirst({
      where: {
        kelasId,
        tanggal: { gte: today, lte: todayEnd },
      },
      include: { absensi: true },
    });

    const todaySummary = sesiHariIni
      ? {
          sudahAbsen: true,
          hadir: sesiHariIni.absensi.filter((a) => a.status === "HADIR").length,
          sakit: sesiHariIni.absensi.filter((a) => a.status === "SAKIT").length,
          izin: sesiHariIni.absensi.filter((a) => a.status === "IZIN").length,
          alpa: sesiHariIni.absensi.filter((a) => a.status === "ALPA").length,
          total: sesiHariIni.absensi.length,
        }
      : { sudahAbsen: false };

    return res.status(200).json({
      success: true,
      week: weekStr,
      kelasNama,
      rangeStart: start.toISOString(),
      rangeEnd: end.toISOString(),
      totalSiswa,
      summaryData,
      dailyPercent,
      todaySummary,
      totalSesi: sesiList.length,
    });
  } catch (error) {
    console.error("API /teacher/class/[id]/rekap Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
