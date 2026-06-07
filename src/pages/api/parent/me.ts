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

    const tahunAktif = await prisma.tahunAjaran.findFirst({
      where: { isActive: true }
    });

    const orangTua = await prisma.orangTua.findUnique({
      where: { id: orangTuaId },
      include: {
        siswa: {
          include: {
            siswaKelas: {
              where: { tahunAjaranId: tahunAktif?.id },
              include: { kelas: true },
            },
          },
        },
      },
    });

    if (!orangTua) {
      return res.status(404).json({ message: "Data orang tua tidak ditemukan" });
    }

    const siswa = orangTua.siswa;
    const kelas =
      siswa.siswaKelas.length > 0 ? siswa.siswaKelas[0].kelas.nama : "—";

    return res.status(200).json({
      success: true,
      parent: {
        id: orangTua.id,
        name: orangTua.nama,
        email: orangTua.email,
        noHp: orangTua.noHp,
      },
      child: {
        id: siswa.id,
        name: siswa.nama,
        nis: siswa.nis,
        kelas,
        jk: siswa.jk,
      },
    });
  } catch (error) {
    console.error("API /parent/me Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
