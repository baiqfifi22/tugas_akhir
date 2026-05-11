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
    const { id } = req.query; // this is kelasId
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ message: "Invalid class ID" });
    }

    const kelasId = parseInt(id, 10);

    // Fetch siswa dari tabel SiswaKelas
    const siswaKelas = await prisma.siswaKelas.findMany({
      where: {
        kelasId: kelasId
      },
      include: {
        siswa: true
      }
    });

    if (!siswaKelas || siswaKelas.length === 0) {
      return res.status(404).json({ message: "Siswa tidak ditemukan untuk kelas ini" });
    }

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
      students
    });

  } catch (error) {
    console.error("API /teacher/class/[id]/students Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
