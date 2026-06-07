import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

const toScore = (rata: number) => Math.round(rata * 20);

function getKategori(rata: number): string {
  if (rata >= 4.5) return "Sangat Baik";
  if (rata >= 3.5) return "Baik";
  if (rata >= 2.5) return "Cukup";
  return "Kurang";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const auth = requireApiRole(req, res, ["KEPALA_SEKOLAH"]);
  if (!auth) return;

  try {
    // Ambil semua TahunAjaran
    const tahunList = await prisma.tahunAjaran.findMany({
      orderBy: { mulai: "desc" },
    });

    const { tahunAjaranId } = req.query;

    // Jika belum ada filter: kembalikan list saja, default ke tahun aktif
    if (!tahunAjaranId) {
      const defaultTahun = tahunList.find((t) => t.isActive) ?? tahunList[0];
      return res.status(200).json({
        success: true,
        tahunList: tahunList.map((t) => ({
          id: t.id,
          nama: t.nama,
          status: t.isActive ? "Aktif" : "Nonaktif",
        })),
        selectedTahunId: defaultTahun?.id ?? null,
      });
    }

    const taid = Number(tahunAjaranId);

    const periodeList = await prisma.periode.findMany({
      where: { tahunAjaranId: taid },
    });

    if (periodeList.length === 0) {
      return res.status(200).json({
        success: true,
        tahunList: tahunList.map((t) => ({
          id: t.id,
          nama: t.nama,
          status: t.isActive ? "Aktif" : "Nonaktif",
        })),
        noData: true,
        message: "Belum ada periode evaluasi untuk tahun ajaran ini",
      });
    }

    const periodeIds = periodeList.map((p) => p.id);

    // Ambil semua evaluasi dengan relasi aspekEval untuk dapat teks soal
    const evalAll = await prisma.evaluasi.findMany({
      where: {
        periodeId: { in: periodeIds },
        skor: { gt: 0 },
      },
      include: {
        guru: { select: { id: true, nama: true } },
        aspekEval: { select: { teks: true } },
      },
    });

    // ── Nilai Rata-rata per Guru ──────────────────────────────────────────
    const guruMap = new Map<number, { nama: string; skorList: number[] }>();

    for (const e of evalAll) {
      if (e.tipe !== "GURU" || !e.guruId || !e.guru) continue;
      if (!guruMap.has(e.guruId)) {
        guruMap.set(e.guruId, { nama: e.guru.nama, skorList: [] });
      }
      guruMap.get(e.guruId)!.skorList.push(e.skor);
    }

    const guruScores = Array.from(guruMap.entries())
      .map(([id, d]) => {
        const rata = d.skorList.reduce((s, v) => s + v, 0) / d.skorList.length;
        return {
          id,
          nama: d.nama,
          rata: parseFloat(rata.toFixed(2)),
          skor: toScore(rata),
        };
      })
      .sort((a, b) => b.skor - a.skor);

    // ── Aspek Paling Dikeluhkan — pakai aspekEval.teks (dari relasi) ──────
    const aspekMap = new Map<string, number[]>();

    for (const e of evalAll) {
      if (e.tipe !== "SEKOLAH") continue;
      const teks = e.aspekEval.teks;
      if (!aspekMap.has(teks)) aspekMap.set(teks, []);
      aspekMap.get(teks)!.push(e.skor);
    }

    const aspekDikeluhkan = Array.from(aspekMap.entries())
      .map(([aspek, skorList]) => {
        const rata = skorList.reduce((s, v) => s + v, 0) / skorList.length;
        const keluhan = Math.round((5 - rata) * skorList.length);
        return { aspek, rata: parseFloat(rata.toFixed(2)), keluhan, jumlah: skorList.length };
      })
      .sort((a, b) => b.keluhan - a.keluhan);

    // ── Distribusi Penilaian Guru ─────────────────────────────────────────
    const kategoriCount: Record<string, number> = {
      "Sangat Baik": 0, "Baik": 0, "Cukup": 0, "Kurang": 0,
    };

    for (const g of guruScores) {
      const kat = getKategori(g.rata);
      kategoriCount[kat]++;
    }

    const totalGuru = guruScores.length;
    const distribusi = Object.entries(kategoriCount).map(([label, count]) => ({
      label,
      count,
      pct: totalGuru > 0 ? Math.round((count / totalGuru) * 100) : 0,
    }));

    // ── Ringkasan ─────────────────────────────────────────────────────────
    const sorted = [...guruScores].sort((a, b) => b.skor - a.skor);
    const highest = sorted[0] ?? null;
    const lowest = sorted[sorted.length - 1] ?? null;

    return res.status(200).json({
      success: true,
      tahunList: tahunList.map((t) => ({
        id: t.id,
        nama: t.nama,
        status: t.isActive ? "Aktif" : "Nonaktif",
      })),
      guruScores,
      aspekDikeluhkan,
      distribusi,
      summary: {
        highest: highest ? { nama: highest.nama, skor: highest.skor } : null,
        lowest: lowest && lowest.id !== highest?.id ? { nama: lowest.nama, skor: lowest.skor } : null,
      },
    });
  } catch (error) {
    console.error("API /principal/reports error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
