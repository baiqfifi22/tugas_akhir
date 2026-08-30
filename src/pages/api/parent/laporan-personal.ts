import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireApiRole(req, res, ["ORANG_TUA"]);
  if (!auth) return;

  const orangTuaId = parseInt(auth.userId, 10);

  // ── GET: Ambil SEMUA guru yang statusnya AKTIF ─────────────────────────────
  if (req.method === "GET") {
    try {
      const semualGuruAktif = await prisma.guru.findMany({
        where: { status: "AKTIF" },
        select: { id: true, nama: true, role: true },
        orderBy: { nama: "asc" },
      });

      return res.status(200).json({
        success: true,
        guruList: semualGuruAktif,
      });
    } catch (error) {
      console.error("GET /api/parent/laporan-personal Error:", error);
      return res.status(500).json({ message: "Gagal mengambil daftar guru" });
    }
  }

  // ── POST: Kirim laporan personal ──────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const { guruId, judul, isi } = req.body ?? {};

      if (!guruId || typeof guruId !== "number") {
        return res.status(400).json({ message: "guruId tidak valid" });
      }
      if (!judul || typeof judul !== "string" || !judul.trim()) {
        return res.status(400).json({ message: "Judul laporan tidak boleh kosong" });
      }
      if (!isi || typeof isi !== "string" || !isi.trim()) {
        return res.status(400).json({ message: "Isi laporan tidak boleh kosong" });
      }

      // Verifikasi orang tua ada
      const orangTua = await prisma.orangTua.findUnique({ where: { id: orangTuaId } });
      if (!orangTua) {
        return res.status(404).json({ message: "Data orang tua tidak ditemukan" });
      }

      // Verifikasi guru ada dan aktif
      const guru = await prisma.guru.findUnique({ where: { id: guruId } });
      if (!guru) {
        return res.status(404).json({ message: "Guru tidak ditemukan" });
      }
      if (guru.status !== "AKTIF") {
        return res.status(400).json({ message: "Guru tidak aktif" });
      }

      // Ambil tahun ajaran aktif
      const tahunAktif = await prisma.tahunAjaran.findFirst({
        where: { isActive: true },
      });
      if (!tahunAktif) {
        return res.status(400).json({ message: "Tidak ada tahun ajaran aktif" });
      }

      const laporan = await prisma.laporanPersonal.create({
        data: {
          orangTuaId,
          guruId,
          tahunAjaranId: tahunAktif.id,
          judul: judul.trim(),
          isi: isi.trim(),
        },
      });

      return res.status(201).json({ success: true, laporan });
    } catch (error) {
      console.error("POST /api/parent/laporan-personal Error:", error);
      return res.status(500).json({
        message: "Terjadi kesalahan pada server. Silakan coba lagi.",
      });
    }
  }

  return res.status(405).json({ message: "Method not allowed" });
}
