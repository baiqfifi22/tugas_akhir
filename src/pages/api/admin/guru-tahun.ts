import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireApiRole(req, res, ["ADMIN"]);
  if (!auth) return;

  try {
    // ── GET: Semua GuruTahun untuk TA aktif (atau TA tertentu) ─────────────
    if (req.method === "GET") {
      const { tahunAjaranId } = req.query;

      let tahunId: number;
      if (tahunAjaranId) {
        tahunId = parseInt(tahunAjaranId as string, 10);
      } else {
        const aktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
        if (!aktif) return res.status(404).json({ message: "Tidak ada tahun ajaran aktif." });
        tahunId = aktif.id;
      }

      const [list, tahun] = await Promise.all([
        prisma.guruTahun.findMany({
          where: { tahunAjaranId: tahunId },
          include: {
            guru: { select: { id: true, nama: true, nip: true, status: true } },
            kelas: { select: { id: true, nama: true } },
          },
          orderBy: [{ guru: { nama: "asc" } }, { kelas: { nama: "asc" } }],
        }),
        prisma.tahunAjaran.findUnique({ where: { id: tahunId } }),
      ]);

      return res.status(200).json({ success: true, data: list, tahun });
    }

    // ── POST: Tambah satu penugasan baru ──────────────────────────────────
    if (req.method === "POST") {
      const { guruId, kelasId, mataPelajaran } = req.body;

      if (!guruId || !kelasId || !mataPelajaran) {
        return res.status(400).json({ message: "guruId, kelasId, dan mataPelajaran wajib diisi." });
      }

      const tahunAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
      if (!tahunAktif) return res.status(404).json({ message: "Tidak ada tahun ajaran aktif." });

      const dup = await prisma.guruTahun.findFirst({
        where: {
          guruId: Number(guruId),
          kelasId: Number(kelasId),
          mataPelajaran,
          tahunAjaranId: tahunAktif.id,
        },
      });
      if (dup) {
        return res.status(409).json({ message: "Penugasan ini sudah ada untuk tahun ajaran aktif." });
      }

      const created = await prisma.guruTahun.create({
        data: {
          guruId: Number(guruId),
          kelasId: Number(kelasId),
          mataPelajaran,
          tahunAjaranId: tahunAktif.id,
        },
        include: {
          kelas: { select: { nama: true } },
          guru: { select: { nama: true } },
        },
      });

      return res.status(201).json({ success: true, data: created });
    }

    // ── DELETE: Hapus satu penugasan ────────────────────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: "ID wajib disertakan." });

      await prisma.guruTahun.delete({ where: { id: Number(id) } });
      return res.status(200).json({ success: true, message: "Penugasan berhasil dihapus." });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /admin/guru-tahun Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}
