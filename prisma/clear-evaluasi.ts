import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🗑️  Menghapus data SubmitEvaluasi...");
  const delSubmit = await prisma.submitEvaluasi.deleteMany({});
  console.log(`   ✅ ${delSubmit.count} baris SubmitEvaluasi dihapus`);

  console.log("🗑️  Menghapus data Evaluasi...");
  const delEval = await prisma.evaluasi.deleteMany({});
  console.log(`   ✅ ${delEval.count} baris Evaluasi dihapus`);

  console.log("\n✅ Selesai. Sekarang jalankan: npx prisma migrate dev");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
