import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireApiRole(req, res, ["KEPALA_SEKOLAH"]);
  if (!auth) return;

  try {
    // ── GET: Ambil semua laporan personal (semua guru) ─────────────────────
    if (req.method === "GET") {
      const { tahunAjaranId } = req.query;

      // Jika tidak ada filter, ambil dari tahun ajaran aktif
      let tahunId: number | undefined;
      if (tahunAjaranId) {
        tahunId = parseInt(tahunAjaranId as string, 10);
      } else {
        const tahunAktif = await prisma.tahunAjaran.findFirst({
          where: { isActive: true },
        });
        tahunId = tahunAktif?.id;
      }

      if (!tahunId) {
        return res.status(200).json({ success: true, laporan: [] });
      }

      const laporan = await prisma.laporanPersonal.findMany({
        where: { tahunAjaranId: tahunId },
        orderBy: { tanggal: "desc" },
        include: {
          orangTua: {
            include: {
              siswa: { select: { nama: true, nis: true } },
            },
          },
          guru: { select: { id: true, nama: true, role: true } },
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
        guru: {
          id: l.guru.id,
          nama: l.guru.nama,
          role: l.guru.role,
        },
        tahunAjaran: l.tahunAjaran.nama,
      }));

      return res.status(200).json({ success: true, laporan: result });
    }

    // ── DELETE: Hapus laporan (hanya yang sudah dikonfirmasi) ─────────────
    if (req.method === "DELETE") {
      const { laporanId } = req.body;

      if (!laporanId || typeof laporanId !== "number") {
        return res.status(400).json({ message: "laporanId tidak valid" });
      }

      const laporan = await prisma.laporanPersonal.findUnique({
        where: { id: laporanId },
      });

      if (!laporan) {
        return res.status(404).json({ message: "Laporan tidak ditemukan" });
      }
      if (!laporan.dikonfirmasi) {
        return res.status(400).json({
          message: "Laporan belum dikonfirmasi guru. Hanya laporan yang sudah dikonfirmasi yang dapat dihapus.",
        });
      }

      await prisma.laporanPersonal.delete({ where: { id: laporanId } });

      return res.status(200).json({ success: true, message: "Laporan berhasil dihapus" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /principal/laporan-personal Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
