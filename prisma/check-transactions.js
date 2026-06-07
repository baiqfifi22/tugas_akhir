const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
    console.log("=== PEMERIKSAAN DATA TRANSAKSI ===");
    
    const countAbsensi = await prisma.absensi.count();
    const countSesiAbsensi = await prisma.sesiAbsensi.count();
    const countLaporan = await prisma.laporan.count();
    const countOrangTua = await prisma.orangTua.count();
    const countIzin = await prisma.izinKehadiran.count();
    const countEvaluasi = await prisma.evaluasi.count();
    const countSubmitEvaluasi = await prisma.submitEvaluasi.count();

    console.log(`- Absensi: ${countAbsensi} baris`);
    console.log(`- Sesi Absensi: ${countSesiAbsensi} baris`);
    console.log(`- Laporan: ${countLaporan} baris`);
    console.log(`- Orang Tua: ${countOrangTua} baris`);
    console.log(`- Izin Kehadiran: ${countIzin} baris`);
    console.log(`- Evaluasi: ${countEvaluasi} baris`);
    console.log(`- Submit Evaluasi: ${countSubmitEvaluasi} baris`);

    if (countAbsensi === 0 && countLaporan === 0 && countOrangTua === 0 && countIzin === 0 && countEvaluasi === 0) {
        console.log("\n>>> STATUS: DATABASE KOSONG DARI DATA TRANSAKSI RIL. AMAN UNTUK DI-RESET. <<<");
    } else {
        console.log("\n>>> STATUS: ADA DATA TRANSAKSI PENTING. TIDAK BOLEH DI-RESET. HARUS DICLEANUP DENGAN SCRIP. <<<");
    }
}

main().finally(() => prisma.$disconnect());
