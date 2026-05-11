import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const userId = req.cookies.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const guruId = parseInt(userId, 10);

  if (req.method === "GET") {
    try {
      // Ambil riwayat laporan
      const laporan = await prisma.laporan.findMany({
        where: { guruId: guruId },
        include: {
          siswa: true,
        },
        orderBy: {
          tanggal: "desc",
        },
      });

      // Ambil daftar siswa yang diajar oleh guru ini
      const guruTahun = await prisma.guruTahun.findMany({
        where: { guruId: guruId },
        include: {
          siswaKelas: {
            include: {
              siswa: true,
              kelas: true,
            },
          },
        },
      });

      // Hapus duplikasi siswa (jika diajar beberapa mapel)
      const studentsMap = new Map();
      guruTahun.forEach((gt) => {
        const s = gt.siswaKelas.siswa;
        const c = gt.siswaKelas.kelas;
        if (!studentsMap.has(s.id)) {
          studentsMap.set(s.id, {
            id: s.id,
            name: s.nama,
            class: `Kelas ${c.nama}`,
          });
        }
      });

      const formattedReports = laporan.map((l) => ({
        id: String(l.id),
        studentId: String(l.siswaId),
        studentName: l.siswa.nama,
        studentClass: studentsMap.get(l.siswaId)?.class || "-", // Jika tidak ketemu kelasnya
        period: "Data Periodik", // Saat ini di DB tidak ada field period, bisa diambil dari tanggal
        notes: l.uraian,
        createdAt: l.tanggal.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      }));

      return res.status(200).json({
        success: true,
        reports: formattedReports,
        students: Array.from(studentsMap.values()),
      });
    } catch (error) {
      console.error("API GET /teacher/reports Error:", error);
      return res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  } else if (req.method === "POST") {
    try {
      const { studentId, notes } = req.body;

      if (!studentId || !notes) {
        return res.status(400).json({ message: "Data tidak lengkap" });
      }

      const newReport = await prisma.laporan.create({
        data: {
          guruId: guruId,
          siswaId: parseInt(studentId, 10),
          uraian: notes,
          tanggal: new Date(),
        },
        include: {
          siswa: true,
        },
      });

      return res.status(200).json({
        success: true,
        report: {
          id: String(newReport.id),
          studentId: String(newReport.siswaId),
          studentName: newReport.siswa.nama,
          studentClass: "-", // Frontend akan menambahkan
          period: "Data Periodik",
          notes: newReport.uraian,
          createdAt: newReport.tanggal.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        },
      });
    } catch (error) {
      console.error("API POST /teacher/reports Error:", error);
      return res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }
  } else {
    return res.status(405).json({ message: "Method not allowed" });
  }
}
