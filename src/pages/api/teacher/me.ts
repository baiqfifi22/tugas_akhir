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

    const tahunAktif = await prisma.tahunAjaran.findFirst({
      where: { isActive: true }
    });

    const guru = await prisma.guru.findUnique({
      where: { id: guruId },
      include: {
        guruTahun: {
          where: { tahunAjaranId: tahunAktif?.id },
          include: {
            kelas: true
          }
        }
      }
    });

    if (!guru) {
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    }

    const classesMap = new Map<number, any>();

    guru.guruTahun.forEach((gt) => {
      const kelas = gt.kelas;
      if (!classesMap.has(kelas.id)) {
        classesMap.set(kelas.id, {
          id: kelas.id,
          name: `Kelas ${kelas.nama}`,
          label: gt.mataPelajaran,
        });
      }
    });

    const myClasses = Array.from(classesMap.values());

    // Gunakan Promise.all agar query berjalan paralel (lebih cepat)
    await Promise.all(
      myClasses.map(async (cls) => {
        const count = await prisma.siswaKelas.count({
          where: { kelasId: cls.id, tahunAjaranId: tahunAktif?.id }
        });
        cls.students = count;
      })
    );

    // Hitung laporan personal yang belum dikonfirmasi
    const unreadLaporan = await prisma.laporanPersonal.count({
      where: { guruId, dikonfirmasi: false },
    });

    return res.status(200).json({
      success: true,
      teacher: {
        id: guru.id,
        name: guru.nama,
        nip: guru.nip,
        email: guru.email,
        role: guru.role,
      },
      classes: myClasses,
      unreadLaporan,
    });
  } catch (error) {
    console.error("API /teacher/me Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
