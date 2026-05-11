/*
  Warnings:

  - Changed the type of `mataPelajaran` on the `GuruTahun` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `mataPelajaran` on the `SesiAbsensi` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MataPelajaran" AS ENUM ('QURAN_HADIST', 'FIQIH', 'SKI', 'AKIDAH_AKHLAK', 'B_ARAB', 'BAHASA_INGGRIS', 'PJOK', 'MATA_PELAJARAN_WAJIB');

-- AlterTable
ALTER TABLE "GuruTahun" DROP COLUMN "mataPelajaran",
ADD COLUMN     "mataPelajaran" "MataPelajaran" NOT NULL;

-- AlterTable
ALTER TABLE "SesiAbsensi" DROP COLUMN "mataPelajaran",
ADD COLUMN     "mataPelajaran" "MataPelajaran" NOT NULL;
