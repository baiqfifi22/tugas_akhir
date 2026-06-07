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
    const { id } = req.query; // this is kelasId
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const kelasId = parseInt(id, 10);

    const tahunAktif = await prisma.tahunAjaran.findFirst({
      where: { isActive: true }
    });

    // Fetch siswa dari tabel SiswaKelas beserta nama kelas
    const siswaKelas = await prisma.siswaKelas.findMany({
      where: {
        kelasId: kelasId,
        tahunAjaranId: tahunAktif?.id
      },
      include: {
        siswa: true,
        kelas: true,
      }
    });

    if (!siswaKelas || siswaKelas.length === 0) {
      return res.status(404).json({ message: "Siswa tidak ditemukan untuk kelas ini" });
    }

    // Ambil nama kelas dari record pertama
    const kelasNama = siswaKelas[0].kelas.nama;

    // Format agar mudah dibaca frontend
    const students = siswaKelas.map((sk) => ({
      id: sk.siswa.id,
      name: sk.siswa.nama,
      nis: sk.siswa.nis,
      jk: sk.siswa.jk,
      status: "" // Status kosong saat dimuat (untuk diisi absensi)
    }));

    return res.status(200).json({
      success: true,
      kelasId: kelasId,
      kelasNama: kelasNama,
      students
    });

  } catch (error) {
    console.error("API /teacher/class/[id]/students Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
