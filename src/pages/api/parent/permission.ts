import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "5mb",
    },
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const auth = requireApiRole(req, res, ["ORANG_TUA"]);
  if (!auth) return;

  try {
    const orangTuaId = parseInt(auth.userId, 10);

    // Cari data orang tua beserta siswa
    const orangTua = await prisma.orangTua.findUnique({
      where: { id: orangTuaId },
      include: { siswa: true },
    });

    if (!orangTua) {
      return res.status(404).json({ message: "Data orang tua tidak ditemukan" });
    }

    // ─── GET: Ambil Riwayat Izin ───
    if (req.method === "GET") {
      const history = await prisma.izinKehadiran.findMany({
        where: { siswaId: orangTua.siswa.id },
        orderBy: { mulai: "desc" }
      });

      return res.status(200).json({
        success: true,
        history
      });
    }

    const { startDate, endDate, reasonType, description, foto } = req.body;

    if (!startDate || !endDate || !reasonType || !description) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const mulai = new Date(startDate);
    const selesai = new Date(endDate);

    if (isNaN(mulai.getTime()) || isNaN(selesai.getTime())) {
      return res.status(400).json({ message: "Format tanggal tidak valid" });
    }

    if (selesai < mulai) {
      return res.status(400).json({ message: "Tanggal selesai tidak boleh sebelum tanggal mulai" });
    }

    // Map reasonType ke StatusKehadiran enum
    const statusMap: Record<string, string> = {
      sakit: "SAKIT",
      izin: "IZIN",
    };

    const status = statusMap[reasonType];
    if (!status) {
      return res.status(400).json({ message: "Jenis izin tidak valid" });
    }

    // foto bersifat opsional — bisa berupa base64 string atau URL
    const fotoValue = foto || "";

    const izin = await prisma.izinKehadiran.create({
      data: {
        siswaId: orangTua.siswa.id,
        mulai,
        selesai,
        status: status as any,
        perihal: description,
        foto: fotoValue,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Pengajuan izin berhasil disimpan",
      izinId: izin.id,
    });
  } catch (error) {
    console.error("API /parent/permission Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
