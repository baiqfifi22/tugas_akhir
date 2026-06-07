import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("=== MEMULAI PROSES DE-DUPLIKASI DATABASE ===");

    // ==========================================
    // 1. DEDUPLIKASI TAHUN AJARAN
    // ==========================================
    console.log("\n1. Membersihkan duplikat Tahun Ajaran...");
    const semuaTahun = await prisma.tahunAjaran.findMany();
    const tahunGroups: { [key: string]: number[] } = {};
    for (const t of semuaTahun) {
        const key = t.nama.trim();
        if (!tahunGroups[key]) tahunGroups[key] = [];
        tahunGroups[key].push(t.id);
    }

    for (const [nama, ids] of Object.entries(tahunGroups)) {
        if (ids.length > 1) {
            const keepId = ids[0];
            const dupIds = ids.slice(1);
            console.log(`- Menyatukan tahun ajaran "${nama}" (Simpan ID: ${keepId}, Hapus ID: ${dupIds.join(", ")})`);

            // Update referensi
            await prisma.sesiAbsensi.updateMany({ where: { tahunAjaranId: { in: dupIds } }, data: { tahunAjaranId: keepId } });
            await prisma.guruTahun.updateMany({ where: { tahunAjaranId: { in: dupIds } }, data: { tahunAjaranId: keepId } });
            await prisma.periode.updateMany({ where: { tahunAjaranId: { in: dupIds } }, data: { tahunAjaranId: keepId } });
            await prisma.siswaKelas.updateMany({ where: { tahunAjaranId: { in: dupIds } }, data: { tahunAjaranId: keepId } });

            // Hapus duplikat
            await prisma.tahunAjaran.deleteMany({ where: { id: { in: dupIds } } });
        }
    }

    // ==========================================
    // 2. DEDUPLIKASI KELAS & MERGE KELAS 4A/4B KE 4
    // ==========================================
    console.log("\n2. Membersihkan dan menyatukan Kelas...");
    
    // Pastikan kelas "4" ada
    let kelas4 = await prisma.kelas.findFirst({ where: { nama: "4" } });
    if (!kelas4) {
        kelas4 = await prisma.kelas.create({ data: { nama: "4" } });
        console.log("- Membuat kelas '4' baru untuk penggabungan");
    }

    // Dapatkan ID kelas 4A dan 4B jika ada
    const kelas4Adan4B = await prisma.kelas.findMany({
        where: { nama: { in: ["4A", "4B"] } }
    });
    const kelas4Adan4BIds = kelas4Adan4B.map(k => k.id);

    if (kelas4Adan4BIds.length > 0) {
        console.log(`- Menyatukan kelas 4A & 4B (ID: ${kelas4Adan4BIds.join(", ")}) ke kelas "4" (ID: ${kelas4.id})`);
        
        // Pindahkan referensi kelas 4A/4B ke kelas 4
        await prisma.siswaKelas.updateMany({ where: { kelasId: { in: kelas4Adan4BIds } }, data: { kelasId: kelas4.id } });
        await prisma.guruTahun.updateMany({ where: { kelasId: { in: kelas4Adan4BIds } }, data: { kelasId: kelas4.id } });
        await prisma.sesiAbsensi.updateMany({ where: { kelasId: { in: kelas4Adan4BIds } }, data: { kelasId: kelas4.id } });

        // Hapus kelas 4A dan 4B
        await prisma.kelas.deleteMany({ where: { id: { in: kelas4Adan4BIds } } });
    }

    // Deduplikasi kelas biasa lainnya (misal ada dua kelas "1A")
    const semuaKelas = await prisma.kelas.findMany();
    const kelasGroups: { [key: string]: number[] } = {};
    for (const k of semuaKelas) {
        const key = k.nama.trim().toUpperCase();
        if (!kelasGroups[key]) kelasGroups[key] = [];
        kelasGroups[key].push(k.id);
    }

    for (const [nama, ids] of Object.entries(kelasGroups)) {
        if (ids.length > 1) {
            const keepId = ids[0];
            const dupIds = ids.slice(1);
            console.log(`- Menyatukan kelas "${nama}" yang duplikat (Simpan ID: ${keepId}, Hapus ID: ${dupIds.join(", ")})`);

            // Update referensi
            await prisma.siswaKelas.updateMany({ where: { kelasId: { in: dupIds } }, data: { kelasId: keepId } });
            await prisma.guruTahun.updateMany({ where: { kelasId: { in: dupIds } }, data: { kelasId: keepId } });
            await prisma.sesiAbsensi.updateMany({ where: { kelasId: { in: dupIds } }, data: { kelasId: keepId } });

            // Hapus duplikat
            await prisma.kelas.deleteMany({ where: { id: { in: dupIds } } });
        }
    }

    // ==========================================
    // 3. DEDUPLIKASI GURU
    // ==========================================
    console.log("\n3. Membersihkan duplikat Guru...");
    const semuaGuru = await prisma.guru.findMany();
    const guruGroups: { [key: string]: number[] } = {};
    for (const g of semuaGuru) {
        const key = g.nip.trim();
        if (!guruGroups[key]) guruGroups[key] = [];
        guruGroups[key].push(g.id);
    }

    for (const [nip, ids] of Object.entries(guruGroups)) {
        if (ids.length > 1) {
            const keepId = ids[0];
            const dupIds = ids.slice(1);
            console.log(`- Menyatukan guru NIP "${nip}" (Simpan ID: ${keepId}, Hapus ID: ${dupIds.join(", ")})`);

            // Update referensi
            await prisma.laporan.updateMany({ where: { guruId: { in: dupIds } }, data: { guruId: keepId } });
            await prisma.sesiAbsensi.updateMany({ where: { guruId: { in: dupIds } }, data: { guruId: keepId } });
            await prisma.guruTahun.updateMany({ where: { guruId: { in: dupIds } }, data: { guruId: keepId } });
            await prisma.evaluasi.updateMany({ where: { guruId: { in: dupIds } }, data: { guruId: keepId } });

            // Hapus duplikat
            await prisma.guru.deleteMany({ where: { id: { in: dupIds } } });
        }
    }

    // ==========================================
    // 4. DEDUPLIKASI SISWA
    // ==========================================
    console.log("\n4. Membersihkan duplikat Siswa...");
    const semuaSiswa = await prisma.siswa.findMany();
    const siswaGroups: { [key: string]: number[] } = {};
    for (const s of semuaSiswa) {
        const key = s.nis.trim();
        if (!siswaGroups[key]) siswaGroups[key] = [];
        siswaGroups[key].push(s.id);
    }

    for (const [nis, ids] of Object.entries(siswaGroups)) {
        if (ids.length > 1) {
            const keepId = ids[0];
            const dupIds = ids.slice(1);
            const namaSiswa = semuaSiswa.find(s => s.id === keepId)?.nama || "";
            console.log(`- Menyatukan siswa "${namaSiswa}" NIS "${nis}" (Simpan ID: ${keepId}, Hapus ID: ${dupIds.join(", ")})`);

            // Update OrangTua jika ada relasi
            // Karena relasi OrangTua ke Siswa adalah one-to-one (siswaId unique), kita harus hati-hati
            const orangTuaDup = await prisma.orangTua.findMany({
                where: { siswaId: { in: dupIds } }
            });

            for (const ot of orangTuaDup) {
                // Periksa apakah siswaKeep sudah punya data OrangTua
                const otKeep = await prisma.orangTua.findUnique({
                    where: { siswaId: keepId }
                });

                if (!otKeep) {
                    // Pindahkan relasi orang tua ke siswa utama
                    await prisma.orangTua.update({
                        where: { id: ot.id },
                        data: { siswaId: keepId }
                    });
                } else {
                    // Jika keduanya punya akun orang tua, gabungkan SubmitEvaluasi lalu hapus duplikat orang tua
                    await prisma.submitEvaluasi.updateMany({
                        where: { orangTuaId: ot.id },
                        data: { orangTuaId: otKeep.id }
                    });
                    await prisma.orangTua.delete({
                        where: { id: ot.id }
                    });
                }
            }

            // Update referensi lainnya
            await prisma.laporan.updateMany({ where: { siswaId: { in: dupIds } }, data: { siswaId: keepId } });
            await prisma.absensi.updateMany({ where: { siswaId: { in: dupIds } }, data: { siswaId: keepId } });
            await prisma.siswaKelas.updateMany({ where: { siswaId: { in: dupIds } }, data: { siswaId: keepId } });
            await prisma.izinKehadiran.updateMany({ where: { siswaId: { in: dupIds } }, data: { siswaId: keepId } });

            // Hapus duplikat
            await prisma.siswa.deleteMany({ where: { id: { in: dupIds } } });
        }
    }

    // ==========================================
    // 5. DEDUPLIKASI RELASI SISWAKELAS
    // ==========================================
    console.log("\n5. Membersihkan duplikat relasi Siswa-Kelas...");
    const semuaSiswaKelas = await prisma.siswaKelas.findMany();
    const siswaKelasGroups: { [key: string]: number[] } = {};
    for (const sk of semuaSiswaKelas) {
        const key = `${sk.siswaId}-${sk.kelasId}-${sk.tahunAjaranId}`;
        if (!siswaKelasGroups[key]) siswaKelasGroups[key] = [];
        siswaKelasGroups[key].push(sk.id);
    }

    for (const [key, ids] of Object.entries(siswaKelasGroups)) {
        if (ids.length > 1) {
            const keepId = ids[0];
            const dupIds = ids.slice(1);
            console.log(`- Menyatukan relasi SiswaKelas "${key}" (Simpan ID: ${keepId}, Hapus ID: ${dupIds.join(", ")})`);
            await prisma.siswaKelas.deleteMany({ where: { id: { in: dupIds } } });
        }
    }

    // ==========================================
    // 6. DEDUPLIKASI RELASI GURUTAHUN
    // ==========================================
    console.log("\n6. Membersihkan duplikat relasi Guru-Tahun...");
    const semuaGuruTahun = await prisma.guruTahun.findMany();
    const guruTahunGroups: { [key: string]: number[] } = {};
    for (const gt of semuaGuruTahun) {
        const key = `${gt.guruId}-${gt.kelasId}-${gt.tahunAjaranId}-${gt.mataPelajaran}`;
        if (!guruTahunGroups[key]) guruTahunGroups[key] = [];
        guruTahunGroups[key].push(gt.id);
    }

    for (const [key, ids] of Object.entries(guruTahunGroups)) {
        if (ids.length > 1) {
            const keepId = ids[0];
            const dupIds = ids.slice(1);
            console.log(`- Menyatukan relasi GuruTahun "${key}" (Simpan ID: ${keepId}, Hapus ID: ${dupIds.join(", ")})`);
            await prisma.guruTahun.deleteMany({ where: { id: { in: dupIds } } });
        }
    }

    console.log("\n=== DATABASE BERHASIL DIBERSIHKAN DARI DUPLIKAT ===");
}

main()
    .catch((e) => {
        console.error("Terjadi error saat membersihkan database:", e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
