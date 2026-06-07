import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireApiRole(req, res, ["ADMIN"]);
  if (!auth) return;

  try {
    // ── GET: Ambil semua periode evaluasi ─────────────────────────────────
    if (req.method === "GET") {
      const periodeList = await prisma.periode.findMany({
        include: {
          tahun: true,
          submitEvaluasi: { select: { id: true } },
        },
        orderBy: { mulai: "desc" },
      });

      const now = new Date();
      const data = periodeList.map((p) => {
        let status: "AKAN_DATANG" | "AKTIF" | "SELESAI" = "AKAN_DATANG";
        if (now >= p.mulai && now <= p.selesai) status = "AKTIF";
        else if (now > p.selesai) status = "SELESAI";

        return {
          id: p.id,
          tahunAjaranId: p.tahunAjaranId,
          tahunAjaran: p.tahun.nama,
          mulai: p.mulai.toISOString(),
          selesai: p.selesai.toISOString(),
          status,
          jumlahSubmit: p.submitEvaluasi.length,
        };
      });

      // Ambil daftar tahun ajaran untuk dropdown form
      const tahunList = await prisma.tahunAjaran.findMany({
        orderBy: { mulai: "desc" },
      });

      const mappedTahunList = tahunList.map((t) => ({
        id: t.id,
        nama: t.nama,
        status: t.isActive ? "Aktif" : "Nonaktif",
      }));

      return res.status(200).json({ success: true, data, tahunList: mappedTahunList });
    }

    // ── POST: Buat periode evaluasi baru ──────────────────────────────────
    if (req.method === "POST") {
      const { tahunAjaranId, mulai, selesai } = req.body;

      if (!tahunAjaranId || !mulai || !selesai) {
        return res.status(400).json({ message: "Semua field harus diisi" });
      }

      const mulaiDate = new Date(mulai);
      const selesaiDate = new Date(selesai);

      if (mulaiDate >= selesaiDate) {
        return res.status(400).json({ message: "Tanggal mulai harus sebelum tanggal selesai" });
      }

      // Cek apakah sudah ada periode aktif di tahun ajaran ini
      const existingAktif = await prisma.periode.findFirst({
        where: {
          tahunAjaranId: Number(tahunAjaranId),
          mulai: { lte: new Date() },
          selesai: { gte: new Date() },
        },
      });

      if (existingAktif) {
        return res.status(400).json({ message: "Sudah ada periode evaluasi yang sedang aktif di tahun ajaran ini" });
      }

      const periode = await prisma.periode.create({
        data: {
          tahunAjaranId: Number(tahunAjaranId),
          mulai: mulaiDate,
          selesai: selesaiDate,
        },
        include: { tahun: true },
      });

      return res.status(201).json({ success: true, data: periode });
    }

    // ── PATCH: Update tanggal periode ─────────────────────────────────────
    if (req.method === "PATCH") {
      const { id, mulai, selesai } = req.body;

      if (!id) return res.status(400).json({ message: "ID periode harus disertakan" });

      const mulaiDate = mulai ? new Date(mulai) : undefined;
      const selesaiDate = selesai ? new Date(selesai) : undefined;

      if (mulaiDate && selesaiDate && mulaiDate >= selesaiDate) {
        return res.status(400).json({ message: "Tanggal mulai harus sebelum tanggal selesai" });
      }

      const updated = await prisma.periode.update({
        where: { id: Number(id) },
        data: {
          ...(mulaiDate && { mulai: mulaiDate }),
          ...(selesaiDate && { selesai: selesaiDate }),
        },
      });

      return res.status(200).json({ success: true, data: updated });
    }

    // ── DELETE: Hapus periode (hanya jika belum ada evaluasi masuk) ────────
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: "ID harus disertakan" });

      const periodeId = Number(id);

      // Cek apakah sudah ada data evaluasi atau submit
      const evalCount = await prisma.evaluasi.count({ where: { periodeId } });
      const submitCount = await prisma.submitEvaluasi.count({ where: { periodeId } });

      if (evalCount > 0 || submitCount > 0) {
        return res.status(400).json({ message: "Tidak dapat menghapus periode yang sudah memiliki data evaluasi" });
      }

      await prisma.periode.delete({ where: { id: periodeId } });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /admin/evaluation Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
