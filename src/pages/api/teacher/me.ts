import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const userId = req.cookies.userId;

    console.log("userId: ", userId);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const guruId = parseInt(userId, 10);


    const guru = await prisma.guru.findUnique({
      where: { id: guruId },
      include: {
        guruTahun: {
          include: {
            siswaKelas: {
              select: {
                kelasId: true,
                kelas: true,
              }
            }
          }
        }
      }
    });

    if (!guru) {
      return res.status(404).json({ message: "Guru tidak ditemukan" });
    }

    const classesMap = new Map<number, any>();

    guru.guruTahun.forEach((gt) => {
      const kelas = gt.siswaKelas.kelas;
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
          where: { kelasId: cls.id }
        });
        cls.students = count;
      })
    );

    return res.status(200).json({
      success: true,
      teacher: {
        id: guru.id,
        name: guru.nama,
        nip: guru.nip,
        role: guru.role,
      },
      classes: myClasses,
    });
  } catch (error) {
    console.error("API /teacher/me Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
