import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireApiRole(req, res, ["ORANG_TUA"]);
  if (!auth) return;

  const orangTuaId = parseInt(auth.userId, 10);

  try {
    // ── GET: Cek status evaluasi & data yang diperlukan ───────────────────
    if (req.method === "GET") {
      const now = new Date();

      const orangTua = await prisma.orangTua.findUnique({
        where: { id: orangTuaId },
        include: { siswa: true },
      });

      if (!orangTua) return res.status(404).json({ message: "Data orang tua tidak ditemukan" });

      const tahunAktif = await prisma.tahunAjaran.findFirst({
        where: { isActive: true },
      });

      if (!tahunAktif) {
        return res.status(200).json({
          success: true,
          status: "BELUM_BUKA",
          message: "Belum ada tahun ajaran aktif",
        });
      }

      const periode = await prisma.periode.findFirst({
        where: { tahunAjaranId: tahunAktif.id },
        orderBy: { mulai: "desc" },
      });

      if (!periode) {
        return res.status(200).json({
          success: true,
          status: "BELUM_BUKA",
          message: "Periode evaluasi belum dibuka oleh admin",
        });
      }

      let statusPeriode: "BELUM_BUKA" | "AKTIF" | "SELESAI";
      if (now < periode.mulai) statusPeriode = "BELUM_BUKA";
      else if (now > periode.selesai) statusPeriode = "SELESAI";
      else statusPeriode = "AKTIF";

      const sudahSubmit = await prisma.submitEvaluasi.findUnique({
        where: {
          orangTuaId_periodeId: { orangTuaId, periodeId: periode.id },
        },
      });

      if (sudahSubmit) {
        return res.status(200).json({
          success: true,
          status: "SUDAH_SUBMIT",
          periode: { id: periode.id, mulai: periode.mulai.toISOString(), selesai: periode.selesai.toISOString() },
        });
      }

      if (statusPeriode !== "AKTIF") {
        return res.status(200).json({
          success: true,
          status: statusPeriode,
          periode: { id: periode.id, mulai: periode.mulai.toISOString(), selesai: periode.selesai.toISOString() },
        });
      }

      // Status AKTIF & belum submit — ambil guru yang mengajar anak
      const siswaId = orangTua.siswaId;

      const siswaKelas = await prisma.siswaKelas.findFirst({
        where: { siswaId, tahunAjaranId: tahunAktif.id },
      });

      let guruList: { id: number; nama: string; mataPelajaran: string }[] = [];

      if (siswaKelas) {
        const guruTahunList = await prisma.guruTahun.findMany({
          where: {
            kelasId: siswaKelas.kelasId,
            tahunAjaranId: tahunAktif.id,
            mataPelajaran: "MATA_PELAJARAN_WAJIB",
          },
          include: { guru: true },
        });
        guruList = guruTahunList.map((gt) => ({
          id: gt.guru.id,
          nama: gt.guru.nama,
          mataPelajaran: gt.mataPelajaran,
        }));
      }

      // Ambil aspek evaluasi dinamis — kembalikan id + teks (bukan hanya teks)
      const activeAspek = await prisma.aspekEvaluasi.findMany({
        where: { aktif: true },
        orderBy: { id: "asc" },
      });

      const aspekSekolah = activeAspek
        .filter((a) => a.tipe === "SEKOLAH")
        .map((a) => ({ id: a.id, teks: a.teks }));

      const aspekGuru = activeAspek
        .filter((a) => a.tipe === "GURU")
        .map((a) => ({ id: a.id, teks: a.teks }));

      return res.status(200).json({
        success: true,
        status: "AKTIF",
        periode: { id: periode.id, mulai: periode.mulai.toISOString(), selesai: periode.selesai.toISOString() },
        guruList,
        aspekSekolah,
        aspekGuru,
      });
    }

    // ── POST: Submit evaluasi ─────────────────────────────────────────────
    if (req.method === "POST") {
      const { periodeId, evaluasiSekolah, evaluasiGuru } = req.body;

      if (!periodeId) return res.status(400).json({ message: "periodeId harus disertakan" });

      const now = new Date();

      const periode = await prisma.periode.findUnique({
        where: { id: Number(periodeId) },
      });

      if (!periode) return res.status(404).json({ message: "Periode tidak ditemukan" });
      if (now < periode.mulai) return res.status(400).json({ message: "Periode evaluasi belum dibuka" });
      if (now > periode.selesai) return res.status(400).json({ message: "Periode evaluasi sudah ditutup" });

      const sudahSubmit = await prisma.submitEvaluasi.findUnique({
        where: { orangTuaId_periodeId: { orangTuaId, periodeId: Number(periodeId) } },
      });

      if (sudahSubmit) {
        return res.status(400).json({ message: "Anda sudah pernah mengisi evaluasi untuk periode ini" });
      }

      if (!Array.isArray(evaluasiSekolah) || evaluasiSekolah.length === 0) {
        return res.status(400).json({ message: "Data evaluasi sekolah tidak valid" });
      }

      const tanggal = new Date();

      // Simpan evaluasi sekolah — pakai aspekId (FK) bukan teks
      const evalSekolahData = evaluasiSekolah.map(
        (e: { aspekId: number; skor: number; kritik?: string }) => ({
          periodeId: Number(periodeId),
          tipe: "SEKOLAH",
          guruId: null,
          aspekId: Number(e.aspekId),
          skor: Number(e.skor),
          kritik: e.kritik || null,
          tanggal,
        })
      );

      // Simpan evaluasi guru — pakai aspekId (FK) bukan teks
      const evalGuruData: any[] = [];
      if (Array.isArray(evaluasiGuru)) {
        for (const eg of evaluasiGuru) {
          for (const aspekItem of eg.aspekList || []) {
            evalGuruData.push({
              periodeId: Number(periodeId),
              tipe: "GURU",
              guruId: Number(eg.guruId),
              aspekId: Number(aspekItem.aspekId),
              skor: Number(aspekItem.skor),
              kritik: aspekItem.kritik || null,
              tanggal,
            });
          }
        }
      }

      await prisma.$transaction([
        prisma.evaluasi.createMany({ data: [...evalSekolahData, ...evalGuruData] }),
        prisma.submitEvaluasi.create({
          data: { orangTuaId, periodeId: Number(periodeId), tanggal },
        }),
      ]);

      return res.status(201).json({ success: true, message: "Evaluasi berhasil dikirim" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /parent/evaluation Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
