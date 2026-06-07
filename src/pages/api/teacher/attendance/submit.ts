import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { StatusKehadiran } from "@prisma/client";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const auth = requireApiRole(req, res, ["GURU", "KEPALA_SEKOLAH"]);
  if (!auth) return;

  try {
    const guruId = parseInt(auth.userId, 10);
    const { kelasId, tanggal, notes, students } = req.body;

    if (!kelasId || !tanggal || !students) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    // Cari TahunAjaran Aktif
    const tahunAjaran = await prisma.tahunAjaran.findFirst({
      where: { isActive: true }
    });

    if (!tahunAjaran) {
      return res.status(404).json({ message: "Tidak ada Tahun Ajaran aktif" });
    }

    // Cari mata pelajaran dari GuruTahun berdasarkan kelasId dan guruId
    const guruTahun = await prisma.guruTahun.findFirst({
      where: {
        guruId: guruId,
        tahunAjaranId: tahunAjaran.id,
        kelasId: parseInt(kelasId, 10)
      }
    });

    const mataPelajaran = guruTahun ? guruTahun.mataPelajaran : "MATA_PELAJARAN_WAJIB";

    // Simpan SesiAbsensi
    const sesi = await prisma.sesiAbsensi.create({
      data: {
        tahunAjaranId: tahunAjaran.id,
        guruId: guruId,
        kelasId: parseInt(kelasId, 10),
        mataPelajaran: mataPelajaran,
        tanggal: new Date(tanggal),
        notes: notes || "",
        absensi: {
          create: students.map((s: any) => ({
            siswaId: s.id,
            status: s.status.toUpperCase() as StatusKehadiran
          }))
        }
      }
    });

    return res.status(200).json({
      success: true,
      message: "Absensi berhasil disimpan",
      sesiId: sesi.id
    });

  } catch (error) {
    console.error("API /teacher/attendance/submit Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
