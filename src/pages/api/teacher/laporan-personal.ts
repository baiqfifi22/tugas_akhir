import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireApiRole(req, res, ["GURU", "KEPALA_SEKOLAH"]);
  if (!auth) return;

  const guruId = parseInt(auth.userId, 10);

  try {
    // ── GET: Ambil laporan masuk untuk guru ini ────────────────────────────
    if (req.method === "GET") {
      const laporan = await prisma.laporanPersonal.findMany({
        where: { guruId },
        orderBy: { tanggal: "desc" },
        include: {
          orangTua: {
            include: {
              siswa: {
                select: { nama: true, nis: true },
              },
            },
          },
          tahunAjaran: { select: { nama: true } },
        },
      });

      const result = laporan.map((l) => ({
        id: l.id,
        judul: l.judul,
        isi: l.isi,
        tanggal: l.tanggal.toISOString(),
        dikonfirmasi: l.dikonfirmasi,
        tanggalKonfirm: l.tanggalKonfirm ? l.tanggalKonfirm.toISOString() : null,
        orangTua: {
          id: l.orangTua.id,
          nama: l.orangTua.nama,
          noHp: l.orangTua.noHp,
        },
        siswa: {
          nama: l.orangTua.siswa.nama,
          nis: l.orangTua.siswa.nis,
        },
        tahunAjaran: l.tahunAjaran.nama,
      }));

      return res.status(200).json({ success: true, laporan: result });
    }

    // ── PATCH: Konfirmasi laporan (sudah hubungi WA) ───────────────────────
    if (req.method === "PATCH") {
      const { laporanId } = req.body;

      if (!laporanId || typeof laporanId !== "number") {
        return res.status(400).json({ message: "laporanId tidak valid" });
      }

      // Pastikan laporan ini memang ditujukan ke guru yang login
      const laporan = await prisma.laporanPersonal.findUnique({
        where: { id: laporanId },
      });

      if (!laporan) {
        return res.status(404).json({ message: "Laporan tidak ditemukan" });
      }
      if (laporan.guruId !== guruId) {
        return res.status(403).json({ message: "Bukan laporan Anda" });
      }
      if (laporan.dikonfirmasi) {
        return res.status(400).json({ message: "Laporan sudah dikonfirmasi sebelumnya" });
      }

      const updated = await prisma.laporanPersonal.update({
        where: { id: laporanId },
        data: {
          dikonfirmasi: true,
          tanggalKonfirm: new Date(),
        },
      });

      return res.status(200).json({ success: true, laporan: updated });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /teacher/laporan-personal Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
