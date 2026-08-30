import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const auth = requireApiRole(req, res, ["KEPALA_SEKOLAH"]);
  if (!auth) return;

  try {
    // Semua TahunAjaran untuk filter dropdown
    const tahunList = await prisma.tahunAjaran.findMany({
      orderBy: { mulai: "desc" },
    });

    // Semua kelas (untuk grafik hari ini)
    const kelasList = await prisma.kelas.findMany({ orderBy: { nama: "asc" } });

    const { tahunAjaranId } = req.query;

    // Jika belum ada filter, kembalikan list pendukung + default aktif
    if (!tahunAjaranId) {
      const defaultTahun = tahunList.find((t) => t.isActive) ?? tahunList[0];
      return res.status(200).json({
        success: true,
        tahunList: tahunList.map((t) => ({ id: t.id, nama: t.nama, status: t.isActive ? "Aktif" : "Nonaktif" })),
        selectedTahunId: defaultTahun?.id ?? null,
      });
    }

    const taid = Number(tahunAjaranId);

    // ── Ambil semua SesiAbsensi dengan tahunAjaranId ini ─────────────────────
    // TIDAK filter by tanggal — cukup pakai tahunAjaranId yang sudah di-tag guru saat absen
    const sesiList = await prisma.sesiAbsensi.findMany({
      where: { tahunAjaranId: taid },
      include: {
        kelas: true,
        absensi: { select: { status: true } },
      },
      orderBy: { tanggal: "asc" },
    });

    // ── Chart Per Kelas ───────────────────────────────────────────────────────
    // Hitung hadir & ketidakhadiran per kelas
    const kelasMap: Record<number, { nama: string; hadir: number; tidakHadir: number; total: number }> = {};

    for (const sesi of sesiList) {
      const kid = sesi.kelasId;
      if (!kelasMap[kid]) kelasMap[kid] = { nama: sesi.kelas.nama, hadir: 0, tidakHadir: 0, total: 0 };
      for (const a of sesi.absensi) {
        kelasMap[kid].total++;
        if (a.status === "HADIR") {
          kelasMap[kid].hadir++;
        } else {
          kelasMap[kid].tidakHadir++;
        }
      }
    }

    const chartPerKelas = Object.entries(kelasMap)
      .map(([id, d]) => ({
        kelasId: Number(id),
        nama: d.nama,
        hadir: d.hadir,
        tidakHadir: d.tidakHadir,
        total: d.total,
        pctHadir: d.total > 0 ? Math.round((d.hadir / d.total) * 100) : 0,
        pctTidakHadir: d.total > 0 ? Math.round((d.tidakHadir / d.total) * 100) : 0,
      }))
      .sort((a, b) => a.nama.localeCompare(b.nama));

    // ── Chart Per Bulan ───────────────────────────────────────────────────────
    // Buat daftar bulan unik dari data yang ada (bukan dari TahunAjaran.mulai/selesai)
    const monthSet = new Set<string>();
    for (const sesi of sesiList) {
      const t = new Date(sesi.tanggal);
      monthSet.add(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`);
    }

    const months = Array.from(monthSet).sort();

    const chartPerWaktu = months.map((m) => {
      const [y, mo] = m.split("-").map(Number);
      const monthStart = new Date(y, mo - 1, 1);
      const monthEnd = new Date(y, mo, 0, 23, 59, 59, 999);

      let hadir = 0, total = 0;
      for (const sesi of sesiList) {
        const t = new Date(sesi.tanggal);
        if (t >= monthStart && t <= monthEnd) {
          for (const a of sesi.absensi) {
            total++;
            if (a.status === "HADIR") hadir++;
          }
        }
      }

      return {
        label: new Date(y, mo - 1, 1).toLocaleDateString("id-ID", { month: "short", year: "2-digit" }),
        month: m,
        pctHadir: total > 0 ? Math.round((hadir / total) * 100) : 0,
        hadir,
        total,
      };
    });

    // ── Status Absensi Hari Ini ───────────────────────────────────────────────
    // Gunakan UTC+8 agar "hari ini" konsisten dengan waktu lokal pengguna Indonesia.
    const WIB_OFFSET_MS = 8 * 60 * 60 * 1000;
    const nowTs = new Date();
    const localNowTs = new Date(nowTs.getTime() + WIB_OFFSET_MS);
    const todayYr  = localNowTs.getUTCFullYear();
    const todayMo  = String(localNowTs.getUTCMonth() + 1).padStart(2, "0");
    const todayDy  = String(localNowTs.getUTCDate()).padStart(2, "0");
    const todayStr = `${todayYr}-${todayMo}-${todayDy}`;
    const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
    const todayEnd   = new Date(`${todayStr}T23:59:59.999Z`);

    const sesiHariIni = await prisma.sesiAbsensi.findMany({
      where: { tanggal: { gte: todayStart, lte: todayEnd } },
      select: { kelasId: true },
    });

    const kelasSudahAbsen = new Set(sesiHariIni.map((s) => s.kelasId));

    const todayStatus = kelasList.map((k) => ({
      kelasId: k.id,
      nama: k.nama,
      sudahAbsen: kelasSudahAbsen.has(k.id),
      jumlahSesi: sesiHariIni.filter((s) => s.kelasId === k.id).length,
    }));

    // ── Ringkasan ─────────────────────────────────────────────────────────────
    const sortedByHadir = [...chartPerKelas].sort((a, b) => b.pctHadir - a.pctHadir);
    const sortedByTidakHadir = [...chartPerKelas].sort((a, b) => b.pctTidakHadir - a.pctTidakHadir);

    const highest = sortedByHadir[0] ?? null;
    const lowest = sortedByHadir[sortedByHadir.length - 1] ?? null;
    const mostAbsent = sortedByTidakHadir[0] ?? null;

    // Total keseluruhan
    const totalHadir = chartPerKelas.reduce((s, k) => s + k.hadir, 0);
    const totalSiswa = chartPerKelas.reduce((s, k) => s + k.total, 0);
    const overallPct = totalSiswa > 0 ? Math.round((totalHadir / totalSiswa) * 100) : 0;

    return res.status(200).json({
      success: true,
      tahunList: tahunList.map((t) => ({ id: t.id, nama: t.nama, status: t.isActive ? "Aktif" : "Nonaktif" })),
      chartPerKelas,
      chartPerWaktu,
      todayStatus,
      summary: {
        highest: highest ? { nama: highest.nama, pct: highest.pctHadir } : null,
        lowest: lowest && lowest.kelasId !== highest?.kelasId
          ? { nama: lowest.nama, pct: lowest.pctHadir } : null,
        mostAbsent: mostAbsent ? { nama: mostAbsent.nama, jumlah: mostAbsent.tidakHadir } : null,
        overallPct,
        totalHadir,
        totalSiswa,
      },
    });
  } catch (error) {
    console.error("API /principal/attendance error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
