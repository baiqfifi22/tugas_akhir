import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const aspekGuru = [
    "Guru menjelaskan materi dengan jelas dan mudah dipahami.",
    "Guru datang tepat waktu saat mengajar.",
    "Guru menjawab pertanyaan siswa dengan baik.",
    "Guru memperlakukan siswa secara adil.",
    "Guru memberikan kesempatan siswa untuk bertanya.",
    "Guru menggunakan metode pembelajaran yang menarik.",
    "Guru menguasai materi pelajaran.",
    "Guru memberikan tugas yang sesuai dengan materi.",
    "Guru memberikan motivasi kepada siswa untuk belajar.",
    "Guru memberikan penilaian secara objektif.",
  ];

  const aspekSekolah = [
    "Lingkungan sekolah bersih dan nyaman.",
    "Fasilitas belajar di sekolah memadai.",
    "Toilet sekolah terawat dengan baik.",
    "Keamanan sekolah terjamin.",
    "Pelayanan administrasi sekolah berjalan dengan baik.",
    "Sekolah mendukung kegiatan akademik siswa.",
    "Sekolah mendukung kegiatan non-akademik siswa.",
    "Informasi sekolah mudah diperoleh siswa.",
    "Hubungan antara siswa dan pihak sekolah berjalan baik.",
    "Saya merasa nyaman belajar di sekolah ini.",
  ];

  console.log("Seeding aspek evaluasi GURU...");
  for (const teks of aspekGuru) {
    const existing = await (prisma as any).aspekEvaluasi.findFirst({
      where: { tipe: "GURU", teks },
    });
    if (!existing) {
      await (prisma as any).aspekEvaluasi.create({
        data: { tipe: "GURU", teks, aktif: true },
      });
      console.log(`  ✅ Ditambahkan [GURU]: ${teks}`);
    } else {
      console.log(`  ⏭️  Sudah ada [GURU]: ${teks}`);
    }
  }

  console.log("\nSeeding aspek evaluasi SEKOLAH...");
  for (const teks of aspekSekolah) {
    const existing = await (prisma as any).aspekEvaluasi.findFirst({
      where: { tipe: "SEKOLAH", teks },
    });
    if (!existing) {
      await (prisma as any).aspekEvaluasi.create({
        data: { tipe: "SEKOLAH", teks, aktif: true },
      });
      console.log(`  ✅ Ditambahkan [SEKOLAH]: ${teks}`);
    } else {
      console.log(`  ⏭️  Sudah ada [SEKOLAH]: ${teks}`);
    }
  }

  console.log("\n✅ Seeding aspek evaluasi selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
