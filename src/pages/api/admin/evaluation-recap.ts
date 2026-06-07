import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const auth = requireApiRole(req, res, ["ADMIN"]);
  if (!auth) return;

  try {
    const { periodeId } = req.query;

    if (!periodeId) {
      const periodeList = await prisma.periode.findMany({
        include: { tahun: true },
        orderBy: { mulai: "desc" },
      });
      const now = new Date();
      return res.status(200).json({
        success: true,
        periodeList: periodeList.map((p) => ({
          id: p.id,
          label: `${p.tahun.nama} (${p.mulai.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} - ${p.selesai.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })})`,
          status: now > p.selesai ? "SELESAI" : now >= p.mulai ? "AKTIF" : "AKAN_DATANG",
          jumlahSubmit: 0,
        })),
      });
    }

    const pid = Number(periodeId);

    const periode = await prisma.periode.findUnique({
      where: { id: pid },
      include: {
        tahun: true,
        submitEvaluasi: { select: { id: true } },
      },
    });

    if (!periode) return res.status(404).json({ message: "Periode tidak ditemukan" });

    const jumlahSubmit = periode.submitEvaluasi.length;

    // ── Rekap Evaluasi Sekolah via relasi aspekEval ────────────────────────
    const evalSekolah = await prisma.evaluasi.findMany({
      where: { periodeId: pid, tipe: "SEKOLAH", skor: { gt: 0 } },
      include: { aspekEval: { select: { id: true, teks: true } } },
    });

    // ── Rekap Evaluasi Guru via relasi aspekEval ───────────────────────────
    const evalGuru = await prisma.evaluasi.findMany({
      where: { periodeId: pid, tipe: "GURU", skor: { gt: 0 } },
      include: {
        guru: { select: { id: true, nama: true } },
        aspekEval: { select: { id: true, teks: true } },
      },
    });

    // ── Ambil semua aspek dari DB (aktif maupun nonaktif) ──────────────────
    const allAspek = await prisma.aspekEvaluasi.findMany({
      orderBy: { id: "asc" },
    });

    const dbAspekSekolah = allAspek.filter((q) => q.tipe === "SEKOLAH").map((q) => q.teks);
    const dbAspekGuru = allAspek.filter((q) => q.tipe === "GURU").map((q) => q.teks);

    // Gabungkan aspek dari DB + aspek historis dari jawaban yang masuk
    const aspekSekolahSet = new Set([
      ...dbAspekSekolah,
      ...evalSekolah.map((e) => e.aspekEval.teks),
    ]);
    const aspekSekolah = Array.from(aspekSekolahSet);

    const aspekGuruSet = new Set([
      ...dbAspekGuru,
      ...evalGuru.map((e) => e.aspekEval.teks),
    ]);
    const aspekGuru = Array.from(aspekGuruSet);

    // ── Hitung Rekap Sekolah ───────────────────────────────────────────────
    const rekapSekolah = aspekSekolah.map((aspekTeks) => {
      const filtered = evalSekolah.filter((e) => e.aspekEval.teks === aspekTeks);
      const avg =
        filtered.length > 0
          ? filtered.reduce((sum, e) => sum + e.skor, 0) / filtered.length
          : 0;
      return { aspek: aspekTeks, rata: parseFloat(avg.toFixed(2)), jumlah: filtered.length };
    });

    // ── Groupkan per guru ──────────────────────────────────────────────────
    const guruMap = new Map<number, { id: number; nama: string; aspek: { aspek: string; skor: number }[] }>();
    for (const e of evalGuru) {
      if (!e.guruId || !e.guru) continue;
      if (!guruMap.has(e.guruId)) {
        guruMap.set(e.guruId, { id: e.guruId, nama: e.guru.nama, aspek: [] });
      }
      guruMap.get(e.guruId)!.aspek.push({ aspek: e.aspekEval.teks, skor: e.skor });
    }

    const rekapGuru = Array.from(guruMap.values()).map((g) => ({
      id: g.id,
      nama: g.nama,
      rekap: aspekGuru.map((aspekTeks) => {
        const filtered = g.aspek.filter((a) => a.aspek === aspekTeks);
        const avg =
          filtered.length > 0
            ? filtered.reduce((sum, a) => sum + a.skor, 0) / filtered.length
            : 0;
        return { aspek: aspekTeks, rata: parseFloat(avg.toFixed(2)), jumlah: filtered.length };
      }),
      rataKeseluruhan: parseFloat(
        (g.aspek.length > 0 ? g.aspek.reduce((s, a) => s + a.skor, 0) / g.aspek.length : 0).toFixed(2)
      ),
    }));

    return res.status(200).json({
      success: true,
      periode: {
        id: periode.id,
        tahunAjaran: periode.tahun.nama,
        mulai: periode.mulai.toISOString(),
        selesai: periode.selesai.toISOString(),
      },
      jumlahSubmit,
      rekapSekolah,
      rekapGuru,
      aspekSekolah,
      aspekGuru,
    });
  } catch (error) {
    console.error("API /admin/evaluation-recap Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
