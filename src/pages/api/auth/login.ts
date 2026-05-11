import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { serialize } from "cookie";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username dan password harus diisi" });
    }

    const setCookie = (id: string, role: string, name: string) => {
      res.setHeader("Set-Cookie", [
        serialize("userId", id, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 7 // 1 week
        }),
        serialize("userRole", role, {
          httpOnly: true,
          path: "/",
          maxAge: 60 * 60 * 24 * 7
        }),
        serialize("userName", name, {
          httpOnly: false, // agar bisa dibaca langsung oleh frontend (JS)
          path: "/",
          maxAge: 60 * 60 * 24 * 7
        })
      ]);
    };

    // 1. Cek Admin (Hardcoded)
    if (username === "admin" && password === "admin123") {
      setCookie("0", "ADMIN", "Administrator");
      return res.status(200).json({
        success: true,
        redirect: "/admin",
      });
    }

    // 2. Cek Guru & Kepala Sekolah (menggunakan NIP)
    const guru = await prisma.guru.findFirst({
      where: {
        nip: username,
      },
    });

    if (guru) {
      // Verifikasi password (dalam produksi sebaiknya gunakan bcrypt)
      if (guru.password === password) {
        let redirectPath = "/teacher";
        if (guru.role === "KEPALA_SEKOLAH") {
          redirectPath = "/principal";
        }

        setCookie(String(guru.id), guru.role, guru.nama);

        return res.status(200).json({
          success: true,
          redirect: redirectPath,
        });
      } else {
        return res.status(401).json({ message: "Password guru salah" });
      }
    }

    // 3. Cek Orang Tua (menggunakan NIS siswa)
    // Mencari siswa berdasarkan NIS, lalu ambil data OrangTua yang berelasi
    const siswa = await prisma.siswa.findFirst({
      where: {
        nis: username,
      },
      include: {
        orangTua: true,
      },
    });

    if (siswa && siswa.orangTua) {
      if (siswa.orangTua.password === password) {
        setCookie(String(siswa.orangTua.id), "ORANG_TUA", siswa.orangTua.nama);
        return res.status(200).json({
          success: true,
          redirect: "/parent",
        });
      } else {
        return res.status(401).json({ message: "Password orang tua salah" });
      }
    }

    // Jika tidak ditemukan satupun
    return res.status(401).json({ message: "Username tidak ditemukan" });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
}
