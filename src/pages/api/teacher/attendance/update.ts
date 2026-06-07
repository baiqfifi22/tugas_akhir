import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { StatusKehadiran } from "@prisma/client";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const auth = requireApiRole(req, res, ["GURU", "KEPALA_SEKOLAH"]);
  if (!auth) return;

  try {
    const guruId = parseInt(auth.userId, 10);
    const { sesiId, notes, students } = req.body;

    if (!sesiId || !students) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // Verifikasi sesi milik guru ini
    const sesi = await prisma.sesiAbsensi.findFirst({
      where: { id: sesiId, guruId: guruId },
    });

    if (!sesi) {
      return res
        .status(404)
        .json({ message: "Sesi absensi tidak ditemukan atau bukan milik Anda" });
    }

    // Update notes sesi
    await prisma.sesiAbsensi.update({
      where: { id: sesiId },
      data: { notes: notes || "" },
    });

    // Update status kehadiran per siswa (upsert: update jika ada, buat baru jika tidak)
    await Promise.all(
      students.map(async (s: { id: number; status: string }) => {
        const statusUpper = s.status.toUpperCase() as StatusKehadiran;

        const existing = await prisma.absensi.findFirst({
          where: { sesiId: sesiId, siswaId: s.id },
        });

        if (existing) {
          await prisma.absensi.update({
            where: { id: existing.id },
            data: { status: statusUpper },
          });
        } else {
          // Siswa baru yang mungkin belum ada di sesi ini
          await prisma.absensi.create({
            data: {
              sesiId: sesiId,
              siswaId: s.id,
              status: statusUpper,
            },
          });
        }
      })
    );

    return res.status(200).json({
      success: true,
      message: "Absensi berhasil diperbarui",
    });
  } catch (error) {
    console.error("API /teacher/attendance/update Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
