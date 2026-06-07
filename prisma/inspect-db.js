const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("=== INSPEKSI DATABASE ===");
    
    const kelasList = await prisma.kelas.findMany();
    console.log("Daftar Kelas di DB:");
    console.dir(kelasList);

    console.log("\nJumlah Siswa per Kelas di SiswaKelas:");
    for (const k of kelasList) {
        const count = await prisma.siswaKelas.count({
            where: { kelasId: k.id }
        });
        console.log(`Kelas "${k.nama}" (ID: ${k.id}): ${count} baris di SiswaKelas`);
    }

    console.log("\nSample Siswa di Kelas 4 (ID: 12 atau sejenisnya):");
    const kelas4 = kelasList.find(k => k.nama === "4");
    if (kelas4) {
        const siswaDiKelas4 = await prisma.siswaKelas.findMany({
            where: { kelasId: kelas4.id },
            include: { siswa: true }
        });
        console.log(`Total data di kelas 4: ${siswaDiKelas4.length}`);
        siswaDiKelas4.forEach((sk, i) => {
            console.log(`${i+1}. [ID Siswa: ${sk.siswaId}] ${sk.siswa.nama} (NIS: ${sk.siswa.nis}) - SiswaKelas ID: ${sk.id}`);
        });
    }

    const totalSiswa = await prisma.siswa.count();
    console.log(`\nTotal Siswa di tabel Siswa: ${totalSiswa}`);
}

main().finally(() => prisma.$disconnect());
