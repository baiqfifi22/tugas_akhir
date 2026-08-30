import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const auth = requireApiRole(req, res, ["ORANG_TUA"]);
  if (!auth) return;

  try {
    const orangTuaId = parseInt(auth.userId, 10);

    const orangTua = await prisma.orangTua.findUnique({
      where: { id: orangTuaId },
      include: { siswa: true },
    });

    if (!orangTua) {
      return res.status(404).json({ message: "Data orang tua tidak ditemukan" });
    }

    const siswa = orangTua.siswa;
    const { month, full, today, view } = req.query;

    const tahunAktif = await prisma.tahunAjaran.findFirst({
      where: { isActive: true },
    });

    if (!tahunAktif) {
      return res.status(404).json({ message: "Tahun ajaran aktif tidak ditemukan" });
    }

    // ── Build date range filter ────────────────────────────────────────────
    let startDate: Date;
    let endDate: Date;

    if (full === "true") {
      startDate = new Date(tahunAktif.mulai);
      endDate = new Date(tahunAktif.selesai);
    } else if (
      view === "bulan" &&
      typeof month === "string" &&
      /^\d{4}-\d{2}$/.test(month)
    ) {
      const [year, mon] = month.split("-").map(Number);
      startDate = new Date(year, mon - 1, 1);
      endDate = new Date(year, mon, 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(tahunAktif.mulai);
      endDate = new Date(tahunAktif.selesai);
    }

    // ── Available months: extend hingga bulan saat ini ───────────────────
    // Fix Bug #6: jika tahunAjaran.selesai sudah lewat (mis. Mei),
    // bulan saat ini (mis. Juli) tetap muncul di dropdown
    const availableMonths: { value: string; label: string }[] = [];
    const curMonth = new Date(tahunAktif.mulai);
    curMonth.setDate(1);
    const nowDate = new Date();
    const nowFirstDay = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
    const tahunSelesaiFirstDay = new Date(
      new Date(tahunAktif.selesai).getFullYear(),
      new Date(tahunAktif.selesai).getMonth(),
      1
    );
    const monthEndLimit =
      nowFirstDay > tahunSelesaiFirstDay ? nowFirstDay : tahunSelesaiFirstDay;

    let loopCount = 0;
    while (curMonth <= monthEndLimit && loopCount < 100) {
      loopCount++;
      const y = curMonth.getFullYear();
      const m = curMonth.getMonth() + 1;
      availableMonths.push({
        value: `${y}-${String(m).padStart(2, "0")}`,
        label: curMonth.toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        }),
      });
      curMonth.setMonth(curMonth.getMonth() + 1);
    }

    // ── Cari kelas siswa & wali kelas ─────────────────────────────────────
    const siswaKelas = await prisma.siswaKelas.findFirst({
      where: { siswaId: siswa.id, tahunAjaranId: tahunAktif.id },
    });

    let waliKelasGuruId: number | null = null;
    if (siswaKelas) {
      const wkGT = await prisma.guruTahun.findFirst({
        where: {
          kelasId: siswaKelas.kelasId,
          tahunAjaranId: tahunAktif.id,
          mataPelajaran: "MATA_PELAJARAN_WAJIB",
        },
      });
      waliKelasGuruId = wkGT?.guruId ?? null;
    }

    // ── Absensi dalam rentang filter ──────────────────────────────────────
    const absensiList = await prisma.absensi.findMany({
      where: {
        siswaId: siswa.id,
        sesi: {
          tanggal: { gte: startDate, lte: endDate },
        },
      },
      include: {
        sesi: {
          include: { guru: true, kelas: true },
        },
      },
      orderBy: { sesi: { tanggal: "desc" } },
    });

    const DAYS_ID = [
      "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu",
    ];

    const attendanceData = absensiList.map((a) => {
      const tgl = a.sesi.tanggal;
      const status =
        a.status === "HADIR"
          ? "Hadir"
          : a.status === "SAKIT"
          ? "Sakit"
          : a.status === "IZIN"
          ? "Izin"
          : "Alpa";
      return {
        date: tgl.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        day: DAYS_ID[tgl.getDay()],
        status,
        note: a.sesi.notes || "—",
        mapel: a.sesi.mataPelajaran,
        guruNama: a.sesi.guru.nama,
        rawDate: tgl.toISOString().split("T")[0], // untuk grouping per hari
      };
    });

    // Stats hanya mata pelajaran wajib (untuk filter aktif)
    const wajibAbsensiList = absensiList.filter(
      (a) => a.sesi.mataPelajaran === "MATA_PELAJARAN_WAJIB"
    );
    const stats = {
      hadir: wajibAbsensiList.filter((a) => a.status === "HADIR").length,
      sakit: wajibAbsensiList.filter((a) => a.status === "SAKIT").length,
      izin: wajibAbsensiList.filter((a) => a.status === "IZIN").length,
      alpa: wajibAbsensiList.filter((a) => a.status === "ALPA").length,
    };

    // ── Limit Info (Feature #5): selalu hitung dari full tahun ajaran ─────
    // Hanya menghitung total izin + alpa (sakit tidak dihitung)
    let limitIzin = stats.izin;
    let limitAlpa = stats.alpa;

    if (view === "bulan") {
      // Ambil ulang dari full tahun untuk limitInfo
      const fullYearWajib = await prisma.absensi.findMany({
        where: {
          siswaId: siswa.id,
          sesi: {
            mataPelajaran: "MATA_PELAJARAN_WAJIB",
            tanggal: {
              gte: new Date(tahunAktif.mulai),
              lte: new Date(tahunAktif.selesai),
            },
          },
        },
      });
      limitIzin = fullYearWajib.filter((a) => a.status === "IZIN").length;
      limitAlpa = fullYearWajib.filter((a) => a.status === "ALPA").length;
    }

    const limitInfo = {
      totalIzinAlpa: limitIzin + limitAlpa,
      maxIzinAlpa: 10,
    };

    // ── Laporan dari wali kelas (Fix Bug #1) ──────────────────────────────
    // Query berdasarkan guruId wali kelas TANPA batasan tanggal
    // sehingga laporan Juli tetap muncul walaupun tahunAjaran.selesai = Mei
    const laporanWaliKelas = waliKelasGuruId
      ? await prisma.laporan.findFirst({
          where: { siswaId: siswa.id, guruId: waliKelasGuruId },
          orderBy: { tanggal: "desc" },
          include: { guru: true },
        })
      : null;

    const report = laporanWaliKelas
      ? {
          period: laporanWaliKelas.tanggal.toLocaleDateString("id-ID", {
            month: "long",
            year: "numeric",
          }),
          teacher: laporanWaliKelas.guru.nama,
          isStructured: !!(
            laporanWaliKelas.perilaku ||
            laporanWaliKelas.akademik ||
            laporanWaliKelas.kedisiplinan
          ),
          notes: laporanWaliKelas.uraian,
          perilaku: laporanWaliKelas.perilaku,
          akademik: laporanWaliKelas.akademik,
          kedisiplinan: laporanWaliKelas.kedisiplinan,
          catatanKhusus: laporanWaliKelas.catatanKhusus,
          rekomendasi: laporanWaliKelas.rekomendasi,
        }
      : null;

    // ── Semua laporan dari semua guru (Feature #9) ────────────────────────
    const allLaporan = await prisma.laporan.findMany({
      where: { siswaId: siswa.id },
      include: { guru: true },
      orderBy: { tanggal: "desc" },
      take: 30,
    });

    const laporanSemuaGuru = allLaporan.map((l) => ({
      id: String(l.id),
      guruNama: l.guru.nama,
      guruId: l.guruId,
      isWaliKelas: l.guruId === waliKelasGuruId,
      tanggal: l.tanggal.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      isStructured: !!(l.perilaku || l.akademik || l.kedisiplinan),
      notes: l.uraian,
      perilaku: l.perilaku,
      akademik: l.akademik,
      kedisiplinan: l.kedisiplinan,
      catatanKhusus: l.catatanKhusus,
      rekomendasi: l.rekomendasi,
    }));

    // ── Absensi hari ini ───────────────────────────────────────────────────
    let localTodayStr: string;
    if (typeof today === "string" && /^\d{4}-\d{2}-\d{2}$/.test(today)) {
      localTodayStr = today;
    } else {
      const nd = new Date();
      localTodayStr = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
    }
    const todayStart = new Date(`${localTodayStr}T00:00:00.000Z`);
    const todayEnd = new Date(`${localTodayStr}T23:59:59.999Z`);

    const todayAbsensiList = await prisma.absensi.findMany({
      where: {
        siswaId: siswa.id,
        sesi: { tanggal: { gte: todayStart, lte: todayEnd } },
      },
      include: { sesi: { include: { guru: true } } },
      orderBy: { sesi: { tanggal: "desc" } },
    });

    const todayAttendance = todayAbsensiList.map((a) => {
      const status =
        a.status === "HADIR"
          ? "Hadir"
          : a.status === "SAKIT"
          ? "Sakit"
          : a.status === "IZIN"
          ? "Izin"
          : "Alpa";
      return {
        date: a.sesi.tanggal.toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        day: DAYS_ID[a.sesi.tanggal.getDay()],
        status,
        note: a.sesi.notes || "—",
        mapel: a.sesi.mataPelajaran,
        guruNama: a.sesi.guru.nama,
      };
    });

    return res.status(200).json({
      success: true,
      childName: siswa.nama,
      childNis: siswa.nis,
      attendanceData,
      todayAttendance,
      stats,
      limitInfo,
      report,
      laporanSemuaGuru,
      availableMonths,
      academicYearName: tahunAktif.nama,
    });
  } catch (error) {
    console.error("API /parent/attendance Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
