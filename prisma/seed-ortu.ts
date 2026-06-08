import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== MEMULAI PROSES SEEDING DATA ORANG TUA ===");

  // 1. Ambil semua siswa dari database
  const semuaSiswa = await prisma.siswa.findMany();
  console.log(`Menemukan ${semuaSiswa.length} data siswa di database.`);

  let countCreated = 0;
  let countSkipped = 0;

  // 2. Iterasi untuk setiap siswa
  for (const siswa of semuaSiswa) {
    // Cek apakah orang tua untuk siswa ini sudah ada
    const existingOrtu = await prisma.orangTua.findUnique({
      where: {
        siswaId: siswa.id,
      },
    });

    if (!existingOrtu) {
      // Buat data orang tua baru sesuai ketentuan
      await prisma.orangTua.create({
        data: {
          siswaId: siswa.id,
          password: siswa.nis, // password default = NIS siswa
          nama: `Orang Tua ${siswa.nama}`, // Nama dashboard
          email: "", // email dikosongkan
          noHp: "", // no hp dikosongkan
        },
      });
      countCreated++;
    } else {
      countSkipped++;
    }
  }

  console.log(`\n=== PROSES SEEDING SELESAI ===`);
  console.log(`✅ Berhasil ditambahkan: ${countCreated} orang tua baru`);
  console.log(`⏭️  Dilewati (sudah ada): ${countSkipped} orang tua`);
}

main()
  .catch((e) => {
    console.error("Terjadi kesalahan saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
