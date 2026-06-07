import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

// Format nama yang valid: "2026(Ganjil)" atau "2026(Genap)"
const NAMA_REGEX = /^\d{4}\((Ganjil|Genap)\)$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = requireApiRole(req, res, ["ADMIN"]);
  if (!auth) return;

  try {
    // ─── GET — Ambil semua tahun ajaran + statistik data terikat ─────────
    if (req.method === "GET") {
      const tahunList = await prisma.tahunAjaran.findMany({
        orderBy: { mulai: "desc" },
        include: {
          _count: {
            select: {
              sesiAbsensi: true,
              guruTahun: true,
              siswaKelas: true,
              periode: true,
            },
          },
        },
      });

      const data = tahunList.map((t) => ({
        id: t.id,
        nama: t.nama,
        status: t.isActive ? "Aktif" : "Nonaktif",
        mulai: t.mulai.toISOString().split("T")[0],
        selesai: t.selesai.toISOString().split("T")[0],
        stats: {
          sesiAbsensi: t._count.sesiAbsensi,
          guruTahun: t._count.guruTahun,
          siswaKelas: t._count.siswaKelas,
          periode: t._count.periode,
        },
      }));

      // Setup status untuk tahun ajaran aktif
      const aktif = data.find((d) => d.status === "Aktif") ?? null;
      let setupStatus: any = null;

      if (aktif) {
        const [siswaSetup, totalSiswaAktif, guruTahunGroups, totalGuruAktif, kelasList] = await Promise.all([
          prisma.siswaKelas.count({ where: { tahunAjaranId: aktif.id } }),
          prisma.siswa.count({ where: { status: "AKTIF" } }),
          // Hitung distinct guru yang sudah punya penugasan di TA ini
          prisma.guruTahun.groupBy({
            by: ["guruId"],
            where: { tahunAjaranId: aktif.id },
          }),
          prisma.guru.count({ where: { status: "AKTIF" } }),
          prisma.kelas.findMany({ orderBy: { nama: "asc" } }),
        ]);
        const guruSetup = guruTahunGroups.length;
        setupStatus = {
          tahunAjaranId: aktif.id,
          tahunAjaranNama: aktif.nama,
          siswaSetup,
          totalSiswaAktif,
          guruSetup,
          totalGuruAktif,
          kelasList: kelasList.map((k) => ({ id: k.id, nama: k.nama })),
        };
      }

      return res.status(200).json({ success: true, data, setupStatus });
    }

    // ─── POST — Buat tahun ajaran baru ───────────────────────────────────
    if (req.method === "POST") {
      const { nama, mulai, selesai } = req.body;

      // Validasi field wajib
      if (!nama || !mulai || !selesai) {
        return res
          .status(400)
          .json({ message: "Nama, tanggal mulai, dan tanggal selesai wajib diisi." });
      }

      // Validasi format nama: "2026(Ganjil)" atau "2026(Genap)"
      if (!NAMA_REGEX.test(nama)) {
        return res.status(400).json({
          message: 'Format nama tidak valid. Gunakan format: "2026(Ganjil)" atau "2026(Genap)".',
        });
      }

      // Cek nama duplikat
      const duplicate = await prisma.tahunAjaran.findFirst({ where: { nama } });
      if (duplicate) {
        return res
          .status(409)
          .json({ message: `Tahun ajaran "${nama}" sudah ada.` });
      }

      const mulaiDate = new Date(mulai);
      const selesaiDate = new Date(selesai);

      // Validasi urutan tanggal
      if (mulaiDate >= selesaiDate) {
        return res
          .status(400)
          .json({ message: "Tanggal mulai harus lebih awal dari tanggal selesai." });
      }

      // Validasi overlap dengan tahun ajaran yang sudah ada
      const overlap = await prisma.tahunAjaran.findFirst({
        where: {
          OR: [
            // Kasus 1: tanggal mulai baru jatuh di dalam rentang yang sudah ada
            { mulai: { lte: mulaiDate }, selesai: { gte: mulaiDate } },
            // Kasus 2: tanggal selesai baru jatuh di dalam rentang yang sudah ada
            { mulai: { lte: selesaiDate }, selesai: { gte: selesaiDate } },
            // Kasus 3: tahun ajaran baru mencakup rentang yang sudah ada sepenuhnya
            { mulai: { gte: mulaiDate }, selesai: { lte: selesaiDate } },
          ],
        },
      });

      if (overlap) {
        return res.status(409).json({
          message: `Rentang tanggal tumpang tindih dengan tahun ajaran "${overlap.nama}" (${overlap.mulai.toISOString().split("T")[0]} – ${overlap.selesai.toISOString().split("T")[0]}).`,
        });
      }

      // Buat dengan status default Nonaktif — admin harus aktifkan secara eksplisit
      const tahun = await prisma.tahunAjaran.create({
        data: {
          nama,
          isActive: false,
          mulai: mulaiDate,
          selesai: selesaiDate,
        },
      });

      return res.status(201).json({ success: true, tahun });
    }

    // ─── PATCH — Aktifkan atau Nonaktifkan ───────────────────────────────
    if (req.method === "PATCH") {
      const { id, action } = req.body;

      if (!id || !action) {
        return res
          .status(400)
          .json({ message: "Field 'id' dan 'action' wajib diisi." });
      }

      const tahunId = parseInt(id, 10);
      if (isNaN(tahunId)) {
        return res.status(400).json({ message: "ID tidak valid." });
      }

      const tahun = await prisma.tahunAjaran.findUnique({
        where: { id: tahunId },
      });
      if (!tahun) {
        return res.status(404).json({ message: "Tahun ajaran tidak ditemukan." });
      }

      // ── Aktifkan ──────────────────────────────────────────────────────
      if (action === "aktifkan") {
        if (tahun.isActive) {
          return res
            .status(200)
            .json({ success: true, message: `"${tahun.nama}" sudah berstatus Aktif.` });
        }

        // Transaksi atomik: nonaktifkan semua → aktifkan yang dipilih
        await prisma.$transaction([
          prisma.tahunAjaran.updateMany({
            where: { isActive: true },
            data: { isActive: false },
          }),
          prisma.tahunAjaran.update({
            where: { id: tahunId },
            data: { isActive: true },
          }),
        ]);

        return res.status(200).json({
          success: true,
          message: `Tahun ajaran "${tahun.nama}" berhasil diaktifkan. Tahun ajaran lain otomatis dinonaktifkan.`,
        });
      }

      // ── Nonaktifkan ───────────────────────────────────────────────────
      if (action === "nonaktifkan") {
        if (!tahun.isActive) {
          return res
            .status(200)
            .json({ success: true, message: `"${tahun.nama}" sudah berstatus Nonaktif.` });
        }

        await prisma.tahunAjaran.update({
          where: { id: tahunId },
          data: { isActive: false },
        });

        return res.status(200).json({
          success: true,
          message: `Tahun ajaran "${tahun.nama}" berhasil dinonaktifkan. Saat ini tidak ada tahun ajaran yang aktif.`,
        });
      }

      return res.status(400).json({
        message: `Action "${action}" tidak dikenali. Gunakan "aktifkan" atau "nonaktifkan".`,
      });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /admin/academic-years Error:", error);
    return res
      .status(500)
      .json({ message: "Terjadi kesalahan pada server." });
  }
}
