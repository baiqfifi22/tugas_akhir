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

  const auth = requireApiRole(req, res, ["GURU", "KEPALA_SEKOLAH"]);
  if (!auth) return;

  try {
    const guruId = parseInt(auth.userId, 10);
    const { kelasId, tanggal } = req.query;

    if (!kelasId || !tanggal) {
      return res.status(400).json({ message: "kelasId dan tanggal diperlukan" });
    }

    // Buat range tanggal untuk mencakup seluruh hari (00:00 - 23:59)
    const targetDate = new Date(tanggal as string);
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Cari sesi absensi yang sudah ada
    const sesi = await prisma.sesiAbsensi.findFirst({
      where: {
        guruId: guruId,
        kelasId: parseInt(kelasId as string, 10),
        tanggal: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        absensi: {
          include: {
            siswa: true,
          },
        },
      },
    });

    const tahunAktif = await prisma.tahunAjaran.findFirst({
      where: { isActive: true }
    });

    // Cari semua izin untuk siswa di kelas ini pada tanggal target
    const classIdInt = parseInt(kelasId as string, 10);
    const siswaKelas = await prisma.siswaKelas.findMany({
      where: { kelasId: classIdInt, tahunAjaranId: tahunAktif?.id },
      select: { siswaId: true }
    });
    const siswaIds = siswaKelas.map(sk => sk.siswaId);

    const activeIzins = await prisma.izinKehadiran.findMany({
      where: {
        siswaId: { in: siswaIds },
        mulai: { lte: targetDate },
        selesai: { gte: targetDate }
      },
      include: {
        siswa: true
      }
    });

    const formattedIzins = activeIzins.map(i => ({
      siswaId: i.siswaId,
      siswaNama: i.siswa.nama,
      tipe: i.status,
      perihal: i.perihal
    }));

    if (!sesi) {
      return res.status(200).json({ sudahAbsen: false, izins: formattedIzins });
    }

    // Format data absensi per siswa
    const absensiData = sesi.absensi.map((a) => ({
      id: a.siswa.id,
      name: a.siswa.nama,
      status: capitalize(a.status), // HADIR -> Hadir
    }));

    // Summary
    const summary = {
      hadir: sesi.absensi.filter((a) => a.status === "HADIR").length,
      sakit: sesi.absensi.filter((a) => a.status === "SAKIT").length,
      izin: sesi.absensi.filter((a) => a.status === "IZIN").length,
      alpa: sesi.absensi.filter((a) => a.status === "ALPA").length,
      total: sesi.absensi.length,
    };

    return res.status(200).json({
      sudahAbsen: true,
      sesiId: sesi.id,
      notes: sesi.notes,
      tanggal: sesi.tanggal,
      summary,
      absensi: absensiData,
      izins: formattedIzins
    });
  } catch (error) {
    console.error("API /teacher/attendance/status Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
