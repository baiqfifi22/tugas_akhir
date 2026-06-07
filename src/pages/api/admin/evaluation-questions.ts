import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { requireApiRole } from "@/lib/withAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const auth = requireApiRole(req, res, ["ADMIN"]);
  if (!auth) return;

  try {
    // ─── GET: Ambil semua pertanyaan (aktif & tidak aktif) ─────────────────
    if (req.method === "GET") {
      const questions = await prisma.aspekEvaluasi.findMany({
        orderBy: { id: "asc" },
      });
      return res.status(200).json({ success: true, data: questions });
    }

    // ─── POST: Buat pertanyaan baru ────────────────────────────────────────
    if (req.method === "POST") {
      const { tipe, teks } = req.body;

      if (!tipe || !teks) {
        return res
          .status(400)
          .json({ message: "Tipe (SEKOLAH/GURU) dan teks pertanyaan wajib diisi." });
      }

      if (tipe !== "SEKOLAH" && tipe !== "GURU") {
        return res.status(400).json({ message: "Tipe harus SEKOLAH atau GURU." });
      }

      const question = await prisma.aspekEvaluasi.create({
        data: {
          tipe,
          teks: teks.trim(),
          aktif: true,
        },
      });

      return res.status(201).json({ success: true, data: question });
    }

    // ─── PUT: Edit pertanyaan ──────────────────────────────────────────────
    if (req.method === "PUT") {
      const { id, teks, aktif } = req.body;

      if (!id) {
        return res.status(400).json({ message: "ID pertanyaan diperlukan." });
      }

      const questionId = parseInt(id, 10);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "ID tidak valid." });
      }

      const existing = await prisma.aspekEvaluasi.findUnique({
        where: { id: questionId },
      });

      if (!existing) {
        return res.status(404).json({ message: "Pertanyaan tidak ditemukan." });
      }

      const updateData: any = {};
      if (teks !== undefined) updateData.teks = teks.trim();
      if (aktif !== undefined) updateData.aktif = Boolean(aktif);

      const updated = await prisma.aspekEvaluasi.update({
        where: { id: questionId },
        data: updateData,
      });

      return res.status(200).json({ success: true, data: updated });
    }

    // ─── DELETE: Hapus atau Nonaktifkan (Soft Delete) ──────────────────────
    if (req.method === "DELETE") {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ message: "ID pertanyaan diperlukan." });
      }

      const questionId = parseInt(id as string, 10);
      if (isNaN(questionId)) {
        return res.status(400).json({ message: "ID tidak valid." });
      }

      const question = await prisma.aspekEvaluasi.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        return res.status(404).json({ message: "Pertanyaan tidak ditemukan." });
      }

      // Cek apakah pertanyaan ini sudah pernah dipakai (via FK aspekId)
      const answerCount = await prisma.evaluasi.count({
        where: { aspekId: questionId },
      });

      if (answerCount > 0) {
        // Sudah ada jawaban: soft delete (nonaktifkan saja)
        const updated = await prisma.aspekEvaluasi.update({
          where: { id: questionId },
          data: { aktif: false },
        });
        return res.status(200).json({
          success: true,
          action: "deactivated",
          message: "Pertanyaan dinonaktifkan secara aman karena telah memiliki riwayat jawaban.",
          data: updated,
        });
      } else {
        // Belum ada jawaban: hard delete
        await prisma.aspekEvaluasi.delete({
          where: { id: questionId },
        });
        return res.status(200).json({
          success: true,
          action: "deleted",
          message: "Pertanyaan berhasil dihapus permanen.",
        });
      }
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API /admin/evaluation-questions Error:", error);
    return res.status(500).json({ message: "Terjadi kesalahan pada server." });
  }
}
