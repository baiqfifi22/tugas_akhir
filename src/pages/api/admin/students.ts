import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

// ── Naik kelas: 1A→2A, 1B→2B, ... 5B→6B, kelas 6 = lulus ──────────────────
function getNextKelas(nama: string): { next: string | null; lulus: boolean } {
  const match = nama.match(/^(\d+)([A-Za-z]+)$/);
  if (!match) return { next: null, lulus: false };
  const grade = parseInt(match[1], 10);
  const section = match[2].toUpperCase();
  if (grade >= 6) return { next: null, lulus: true };
  return { next: `${grade + 1}${section}`, lulus: false };
}

/**
 * Cari kelas tujuan di DB dengan fallback cerdas untuk merger/split.
 * @param targetNama Nama kelas target ideal, e.g. "5B" atau "2C"
 * @param indexUrut Indeks urut siswa dari kelas asal (untuk round-robin distribution)
 */
async function findNextKelasWithFallback(targetNama: string, indexUrut: number): Promise<{ id: number; nama: string } | null> {
  // 1. Cari exact match (e.g. "5B", "2A")
  let targetKelas = await prisma.kelas.findFirst({ where: { nama: targetNama } });
  if (targetKelas) return targetKelas;

  const match = targetNama.match(/^(\d+)/);
  if (!match) return null;
  const gradeNum = match[1];

  // 2. Fallback 1: Cari kelas dengan angka grade saja (e.g. kelas "5")
  targetKelas = await prisma.kelas.findFirst({ where: { nama: gradeNum } });
  if (targetKelas) return targetKelas;

  // 3. Fallback 2: Cari semua kelas yang berawalan angka grade tersebut (e.g. "2A", "2B" untuk target "2C")
  const availableClasses = await prisma.kelas.findMany({
    where: { nama: { startsWith: gradeNum } },
    orderBy: { nama: "asc" },
  });

  if (availableClasses.length > 0) {
    // Round-robin distribution
    const selectIndex = indexUrut % availableClasses.length;
    return availableClasses[selectIndex];
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = requireApiRole(req, res, ["ADMIN"]);
  if (!auth) return;

  try {
    // ─── GET ───────────────────────────────────────────────────────────────
    if (req.method === "GET") {
      const { search, status, kelasId, tahunAjaranId } = req.query;

      const where: any = {};
      if (status && status !== "all") {
        where.status = status as string;
      }
      if (search) {
        where.OR = [
          { nama: { contains: search as string, mode: "insensitive" } },
          { nis: { contains: search as string, mode: "insensitive" } },
        ];
      }

      let targetTahunId = tahunAjaranId ? parseInt(tahunAjaranId as string, 10) : undefined;
      if (!targetTahunId) {
        const tahunAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
        targetTahunId = tahunAktif?.id;
      }

      if (targetTahunId) {
        where.siswaKelas = {
          some: {
            tahunAjaranId: targetTahunId
          }
        };
      }

      const siswaList = await prisma.siswa.findMany({
        where,
        include: {
          orangTua: true,
          siswaKelas: {
            where: { tahunAjaranId: targetTahunId },
            include: { kelas: true },
            orderBy: { id: "desc" },
            take: 1,
          },
        },
        orderBy: { nama: "asc" },
      });

      const students = siswaList.map((s) => ({
        id: s.id,
        nis: s.nis,
        nama: s.nama,
        ttl: s.ttl,
        jk: s.jk,
        status: s.status,
        kelas: s.siswaKelas[0]?.kelas?.nama ?? "—",
        kelasId: s.siswaKelas[0]?.kelasId ?? null,
        ortu: s.orangTua?.nama ?? "—",
      }));

      // Sort by class name in memory (e.g. 1A, 1B, 2A, 10, etc.)
      students.sort((a, b) => {
        if (a.kelas === "—") return 1;
        if (b.kelas === "—") return -1;
        return a.kelas.localeCompare(b.kelas, undefined, { numeric: true, sensitivity: 'base' });
      });

      // Filter by kelasId if provided
      const filtered = kelasId
        ? students.filter((s) => String(s.kelasId) === String(kelasId))
        : students;

      return res.status(200).json({ success: true, students: filtered });
    }

    // ─── POST — Tambah siswa ───────────────────────────────────────────────
    if (req.method === "POST") {
      const { nis, nama, ttl, jk, kelasId } = req.body;
      if (!nis || !nama || !ttl || !jk || !kelasId) {
        return res.status(400).json({ message: "Data tidak lengkap" });
      }

      const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });

      const siswa = await prisma.siswa.create({
        data: {
          nis,
          nama,
          ttl,
          jk,
          status: "AKTIF",
          siswaKelas: {
            create: {
              kelasId: parseInt(kelasId, 10),
              tahunAjaranId: tahunAjaran?.id,
            },
          },
        },
      });

      return res.status(200).json({ success: true, siswa });
    }

    // ─── PUT — Edit / Naik Kelas / Nonaktifkan ─────────────────────────────
    if (req.method === "PUT") {
      const { id, action, ...rest } = req.body;

      // ── Bulk actions (tidak butuh id siswa tunggal) ──────────────────────
      if (action === "wizard_naik_kelas") {
        const { targetKelasId, sourceKelasId, checkedSiswaIds, uncheckedSiswaIds, isClass6 } = req.body;
        
        const tahunAktif = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
        if (!tahunAktif) return res.status(404).json({ message: "Tidak ada tahun ajaran aktif." });

        const operations = [];

        if (isClass6) {
          // Siswa yang dicentang -> Lulus (NONAKTIF)
          if (checkedSiswaIds && checkedSiswaIds.length > 0) {
            operations.push(
              prisma.siswa.updateMany({
                where: { id: { in: checkedSiswaIds.map(Number) } },
                data: { status: "NONAKTIF" },
              })
            );
          }
        } else {
          // Siswa yang dicentang -> Naik Kelas (Masuk ke kelas tujuan baru)
          if (checkedSiswaIds && checkedSiswaIds.length > 0 && targetKelasId) {
            const dataToInsert = checkedSiswaIds.map((sid: number) => ({
              siswaId: Number(sid),
              kelasId: Number(targetKelasId),
              tahunAjaranId: tahunAktif.id,
            }));
            operations.push(
              prisma.siswaKelas.createMany({
                data: dataToInsert,
              })
            );
          }
        }

        // Siswa yang tidak dicentang -> Tinggal Kelas (Mengulang di kelas asal)
        if (uncheckedSiswaIds && uncheckedSiswaIds.length > 0 && sourceKelasId) {
          const dataToInsert = uncheckedSiswaIds.map((sid: number) => ({
            siswaId: Number(sid),
            kelasId: Number(sourceKelasId),
            tahunAjaranId: tahunAktif.id,
          }));
          operations.push(
            prisma.siswaKelas.createMany({
              data: dataToInsert,
            })
          );
        }

        if (operations.length > 0) {
          await prisma.$transaction(operations);
        }

        return res.status(200).json({
          success: true,
          message: "Kenaikan kelas massal berhasil diproses.",
        });
      }

      // ── Per-siswa actions (butuh id) ─────────────────────────────────────
      if (!id) return res.status(400).json({ message: "ID diperlukan" });

      const siswaId = parseInt(id, 10);

      if (action === "nonaktif") {
        await prisma.siswa.update({ where: { id: siswaId }, data: { status: "NONAKTIF" } });
        return res.status(200).json({ success: true, message: "Siswa dinonaktifkan" });
      }

      if (action === "aktif") {
        await prisma.siswa.update({ where: { id: siswaId }, data: { status: "AKTIF" } });
        return res.status(200).json({ success: true, message: "Siswa diaktifkan kembali" });
      }

      if (action === "naik_kelas") {
        const currentSK = await prisma.siswaKelas.findFirst({
          where: { siswaId },
          include: { kelas: true },
          orderBy: { id: "desc" },
        });
        if (!currentSK) return res.status(404).json({ message: "Data kelas siswa tidak ditemukan" });

        const { next: nextKelasNama, lulus } = getNextKelas(currentSK.kelas.nama);

        if (lulus) {
          await prisma.siswa.update({ where: { id: siswaId }, data: { status: "NONAKTIF" } });
          return res.status(200).json({ success: true, message: "Siswa telah menyelesaikan kelas 6, status dinonaktifkan" });
        }
        if (!nextKelasNama) return res.status(400).json({ message: `Kelas "${currentSK.kelas.nama}" tidak dikenali` });

        const nextKelas = await findNextKelasWithFallback(nextKelasNama, 0);
        if (!nextKelas) return res.status(404).json({ message: `Kelas tujuan untuk kelas asal "${currentSK.kelas.nama}" belum ada di database` });

        const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
        await prisma.siswaKelas.create({
          data: { siswaId, kelasId: nextKelas.id, tahunAjaranId: tahunAjaran?.id },
        });
        return res.status(200).json({ success: true, message: `Siswa dinaikkan ke kelas ${nextKelas.nama}` });
      }

      const { nis, nama, ttl, jk, kelasId } = rest;
      const updateData: any = {};
      if (nis) updateData.nis = nis;
      if (nama) updateData.nama = nama;
      if (ttl) updateData.ttl = ttl;
      if (jk) updateData.jk = jk;

      await prisma.siswa.update({ where: { id: siswaId }, data: updateData });

      if (kelasId) {
        // Update kelas: tambah record baru SiswaKelas
        const tahunAjaran = await prisma.tahunAjaran.findFirst({ where: { isActive: true } });
        await prisma.siswaKelas.create({
          data: {
            siswaId,
            kelasId: parseInt(kelasId, 10),
            tahunAjaranId: tahunAjaran?.id,
          },
        });
      }

      return res.status(200).json({ success: true, message: "Data siswa diperbarui" });
    }

    // ─── DELETE — Hapus permanen siswa ────────────────────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ message: "ID diperlukan" });

      const siswaId = parseInt(id as string, 10);

      // Hapus semua relasi terlebih dahulu agar tidak ada foreign key error
      // 1. Hapus data absensi siswa (via join ke sesi)
      await prisma.absensi.deleteMany({ where: { siswaId } });
      // 2. Hapus catatan izin kehadiran
      await prisma.izinKehadiran.deleteMany({ where: { siswaId } });
      // 3. Hapus laporan guru untuk siswa ini
      await prisma.laporan.deleteMany({ where: { siswaId } });
      // 4. Hapus data kelas siswa
      await prisma.siswaKelas.deleteMany({ where: { siswaId } });
      // 5. Hapus orang tua (jika ada, karena @unique)
      await prisma.orangTua.deleteMany({ where: { siswaId } });
      // 6. Hapus siswa
      await prisma.siswa.delete({ where: { id: siswaId } });

      return res.status(200).json({ success: true, message: "Siswa berhasil dihapus permanen" });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /admin/students Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
