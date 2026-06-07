import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = requireApiRole(req, res, ["GURU", "KEPALA_SEKOLAH"]);
  if (!auth) return;

  const guruId = parseInt(auth.userId, 10);

  // ─── GET ───────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const { kelasId } = req.query;

      if (!kelasId || typeof kelasId !== "string") {
        return res
          .status(400)
          .json({ message: "kelasId diperlukan sebagai query param" });
      }

      const kelasIdInt = parseInt(kelasId, 10);

      const tahunAktif = await prisma.tahunAjaran.findFirst({
        where: { isActive: true }
      });

      // 1. Ambil semua siswa di kelas ini
      const siswaKelas = await prisma.siswaKelas.findMany({
        where: { kelasId: kelasIdInt, tahunAjaranId: tahunAktif?.id },
        include: { siswa: true, kelas: true },
      });

      const students = siswaKelas.map((sk) => ({
        id: String(sk.siswa.id),
        name: sk.siswa.nama,
        nis: sk.siswa.nis,
        avatar: sk.siswa.nama
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase(),
      }));

      const kelasNama =
        siswaKelas.length > 0 ? siswaKelas[0].kelas.nama : kelasId;

      // 2. Ambil semua laporan yang pernah dibuat guru ini untuk siswa di kelas tsb
      const siswaIds = siswaKelas.map((sk) => sk.siswaId);

      const laporanList = await prisma.laporan.findMany({
        where: {
          guruId: guruId,
          siswaId: { in: siswaIds },
        },
        include: { siswa: true },
        orderBy: { tanggal: "desc" },
      });

      const reports = laporanList.map((l) => ({
        id: String(l.id),
        studentId: String(l.siswaId),
        studentName: l.siswa.nama,
        notes: l.uraian,
        createdAt: l.tanggal.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      }));

      return res.status(200).json({
        success: true,
        kelasNama,
        students,
        reports,
      });
    } catch (error) {
      console.error("API GET /teacher/reports Error:", error);
      return res.status(500).json({ message: "Terjadi kesalahan pada server" });
    }

  // ─── POST ──────────────────────────────────────────────────────────────────
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
        include: { siswa: true },
      });

      return res.status(200).json({
        success: true,
        report: {
          id: String(newReport.id),
          studentId: String(newReport.siswaId),
          studentName: newReport.siswa.nama,
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
