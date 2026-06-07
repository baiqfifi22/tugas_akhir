import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireApiRole(req, res, ["ADMIN"]);
  if (!auth) return;

  try {
    // ─── GET ───────────────────────────────────────────────────────────────
    if (req.method === "GET") {
      const { search, status, tahunAjaranId } = req.query;

      const where: any = {};
      if (status && status !== "all") {
        where.status = status as string;
      }
      if (search) {
        where.OR = [
          { nama: { contains: search as string, mode: "insensitive" } },
          { nip: { contains: search as string, mode: "insensitive" } },
        ];
      }

      // Tentukan tahun ajaran yang dipakai untuk filter penugasan
      let tahunTarget: { id: number; nama: string } | null = null;
      if (tahunAjaranId) {
        tahunTarget = await prisma.tahunAjaran.findUnique({
          where: { id: parseInt(tahunAjaranId as string, 10) },
          select: { id: true, nama: true },
        });
      } else {
        tahunTarget = await prisma.tahunAjaran.findFirst({
          where: { isActive: true },
          select: { id: true, nama: true },
        });
      }

      const [guruList, kelasList, tahunList] = await Promise.all([
        prisma.guru.findMany({
          where,
          include: {
            guruTahun: {
              include: { kelas: true, tahun: true },
              orderBy: { id: "desc" },
            },
          },
          orderBy: { nama: "asc" },
        }),
        prisma.kelas.findMany({ orderBy: { nama: "asc" } }),
        prisma.tahunAjaran.findMany({
          orderBy: { mulai: "desc" },
          select: { id: true, nama: true, isActive: true },
        }),
      ]);

      const teachers = guruList.map((g) => {
        // Filter penugasan sesuai tahun ajaran yang dipilih
        const selectedAssignments = tahunTarget
          ? g.guruTahun.filter((gt) => gt.tahunAjaranId === tahunTarget!.id)
          : [];

        const kelasArr = [...new Set(selectedAssignments.map((gt) => gt.kelas.nama))];
        const mapelArr = [...new Set(selectedAssignments.map((gt) => gt.mataPelajaran))];

        return {
          id: g.id,
          nip: g.nip,
          nama: g.nama,
          email: g.email,
          noHp: g.noHp,
          role: g.role,
          status: g.status,
          kelas: kelasArr.join(", ") || "—",
          mapel: mapelArr.join(", ") || "—",
          activeAssignments: selectedAssignments.map((gt) => ({
            id: gt.id,
            kelasId: gt.kelasId,
            kelasNama: gt.kelas.nama,
            mataPelajaran: gt.mataPelajaran,
          })),
        };
      });

      return res.status(200).json({
        success: true,
        teachers,
        kelasList: kelasList.map((k) => ({ id: k.id, nama: k.nama })),
        tahunAktifNama: tahunTarget?.nama ?? null,
        tahunAktifId: tahunTarget?.id ?? null,
        tahunList: tahunList.map((t) => ({ id: t.id, nama: t.nama, isActive: t.isActive })),
      });
    }

    // ─── POST — Tambah guru ────────────────────────────────────────────────
    if (req.method === "POST") {
      const { nip, nama, email, noHp, password, role } = req.body;
      if (!nip || !nama || !email || !noHp || !password || !role) {
        return res.status(400).json({ message: "Data tidak lengkap" });
      }

      const existing = await prisma.guru.findFirst({ where: { nip } });
      if (existing) return res.status(409).json({ message: "NIP sudah terdaftar" });

      const guru = await prisma.guru.create({
        data: { nip, nama, email, noHp, password, role, status: "AKTIF" },
      });

      return res.status(200).json({ success: true, guru });
    }

    // ─── PUT — Edit guru ───────────────────────────────────────────────────
    if (req.method === "PUT") {
      const { id, action, ...rest } = req.body;
      if (!id) return res.status(400).json({ message: "ID diperlukan" });

      const guruId = parseInt(id, 10);

      if (action === "toggle_status") {
        const guru = await prisma.guru.findUnique({ where: { id: guruId } });
        if (!guru) return res.status(404).json({ message: "Guru tidak ditemukan" });

        const newStatus = guru.status === "AKTIF" ? "NONAKTIF" : "AKTIF";
        await prisma.guru.update({ where: { id: guruId }, data: { status: newStatus } });
        return res.status(200).json({ success: true, message: `Status guru diubah menjadi ${newStatus}` });
      }

      // Default: update data
      const { nip, nama, email, noHp, role, password } = rest;
      const updateData: any = {};
      if (nip) updateData.nip = nip;
      if (nama) updateData.nama = nama;
      if (email) updateData.email = email;
      if (noHp) updateData.noHp = noHp;
      if (role) updateData.role = role;
      if (password) updateData.password = password;

      await prisma.guru.update({ where: { id: guruId }, data: updateData });
      return res.status(200).json({ success: true, message: "Data guru diperbarui" });
    }

    // ─── DELETE — Hapus permanen guru ───────────────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: "ID diperlukan" });

      const guruId = parseInt(id as string, 10);

      // Hapus relasi terlebih dahulu
      // 1. Hapus semua absensi dalam sesi yang dibuat guru ini
      const sesiList = await prisma.sesiAbsensi.findMany({ where: { guruId } });
      const sesiIds = sesiList.map((s) => s.id);
      if (sesiIds.length > 0) {
        await prisma.absensi.deleteMany({ where: { sesiId: { in: sesiIds } } });
      }
      // 2. Hapus sesi absensi
      await prisma.sesiAbsensi.deleteMany({ where: { guruId } });
      // 3. Hapus laporan yang dibuat guru
      await prisma.laporan.deleteMany({ where: { guruId } });
      // 4. Hapus relasi GuruTahun
      await prisma.guruTahun.deleteMany({ where: { guruId } });
      // 5. Hapus guru
      await prisma.guru.delete({ where: { id: guruId } });

      return res.status(200).json({ success: true, message: "Guru berhasil dihapus permanen" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /admin/teachers Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
