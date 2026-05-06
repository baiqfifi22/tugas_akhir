/*
  Warnings:

  - You are about to drop the `Test` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "StatusGuru" AS ENUM ('AKTIF', 'NONAKTIF');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('KEPALA_SEKOLAH', 'WALI_KELAS', 'GURU_MAPEL');

-- CreateEnum
CREATE TYPE "StatusKehadiran" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALPA');

-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- CreateEnum
CREATE TYPE "StatusAktif" AS ENUM ('AKTIF', 'NONAKTIF');

-- DropTable
DROP TABLE "Test";

-- CreateTable
CREATE TABLE "Guru" (
    "id" SERIAL NOT NULL,
    "nip" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "StatusGuru" NOT NULL,
    "noHp" TEXT NOT NULL,
    "role" "Role" NOT NULL,

    CONSTRAINT "Guru_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siswa" (
    "id" SERIAL NOT NULL,
    "nis" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "ttl" TEXT NOT NULL,
    "status" "StatusAktif" NOT NULL,
    "jk" "JenisKelamin" NOT NULL,

    CONSTRAINT "Siswa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TahunAjaran" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL,
    "mulai" TIMESTAMP(3) NOT NULL,
    "selesai" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TahunAjaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiswaKelas" (
    "id" SERIAL NOT NULL,
    "siswaId" INTEGER NOT NULL,
    "kelasId" INTEGER NOT NULL,

    CONSTRAINT "SiswaKelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuruTahun" (
    "id" SERIAL NOT NULL,
    "guruId" INTEGER NOT NULL,
    "tahunAjaranId" INTEGER NOT NULL,
    "siswaKelasId" INTEGER NOT NULL,
    "mataPelajaran" TEXT NOT NULL,

    CONSTRAINT "GuruTahun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SesiAbsensi" (
    "id" SERIAL NOT NULL,
    "tahunAjaranId" INTEGER NOT NULL,
    "guruId" INTEGER NOT NULL,
    "notes" TEXT,
    "mataPelajaran" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SesiAbsensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" SERIAL NOT NULL,
    "siswaId" INTEGER NOT NULL,
    "sesiId" INTEGER NOT NULL,
    "status" "StatusKehadiran" NOT NULL,

    CONSTRAINT "Absensi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Laporan" (
    "id" SERIAL NOT NULL,
    "guruId" INTEGER NOT NULL,
    "siswaId" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "uraian" TEXT NOT NULL,

    CONSTRAINT "Laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrangTua" (
    "id" SERIAL NOT NULL,
    "siswaId" INTEGER NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "noHp" TEXT NOT NULL,

    CONSTRAINT "OrangTua_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IzinKehadiran" (
    "id" SERIAL NOT NULL,
    "siswaId" INTEGER NOT NULL,
    "mulai" TIMESTAMP(3) NOT NULL,
    "selesai" TIMESTAMP(3) NOT NULL,
    "status" "StatusKehadiran" NOT NULL,
    "perihal" TEXT NOT NULL,
    "foto" TEXT NOT NULL,

    CONSTRAINT "IzinKehadiran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Periode" (
    "id" SERIAL NOT NULL,
    "tahunAjaranId" INTEGER NOT NULL,
    "mulai" TIMESTAMP(3) NOT NULL,
    "selesai" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Periode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluasi" (
    "id" SERIAL NOT NULL,
    "periodeId" INTEGER NOT NULL,
    "tipe" TEXT NOT NULL,
    "kritik" INTEGER NOT NULL,
    "skor" INTEGER NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evaluasi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrangTua_siswaId_key" ON "OrangTua"("siswaId");

-- AddForeignKey
ALTER TABLE "SiswaKelas" ADD CONSTRAINT "SiswaKelas_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiswaKelas" ADD CONSTRAINT "SiswaKelas_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruTahun" ADD CONSTRAINT "GuruTahun_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruTahun" ADD CONSTRAINT "GuruTahun_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruTahun" ADD CONSTRAINT "GuruTahun_siswaKelasId_fkey" FOREIGN KEY ("siswaKelasId") REFERENCES "SiswaKelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesiAbsensi" ADD CONSTRAINT "SesiAbsensi_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SesiAbsensi" ADD CONSTRAINT "SesiAbsensi_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_sesiId_fkey" FOREIGN KEY ("sesiId") REFERENCES "SesiAbsensi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laporan" ADD CONSTRAINT "Laporan_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "Guru"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Laporan" ADD CONSTRAINT "Laporan_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrangTua" ADD CONSTRAINT "OrangTua_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IzinKehadiran" ADD CONSTRAINT "IzinKehadiran_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "Siswa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Periode" ADD CONSTRAINT "Periode_tahunAjaranId_fkey" FOREIGN KEY ("tahunAjaranId") REFERENCES "TahunAjaran"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluasi" ADD CONSTRAINT "Evaluasi_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "Periode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
