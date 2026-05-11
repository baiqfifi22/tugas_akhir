import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.guru.createMany({
        data: [
            {
                nip: "12345",
                password: "guru12345",
                nama: "Nikmatun Falah S.Pd",
                email: "nikmatunfalah97@gmail.com",
                status: "AKTIF",
                noHp: "087778211491",
                role: "WALI_KELAS",
            },
            {
                nip: "23456",
                password: "guru23456",
                nama: "Iswatun Hasanah, M. Pd",
                email: "iswah1306@gmail.com",
                status: "AKTIF",
                noHp: "081977855154",
                role: "GURU_MAPEL",
            },
            {
                nip: "34567",
                password: "guru34567",
                nama: "Rizka Aulia P, S.Pd",
                email: "rizliaririz@gmail.com",
                status: "AKTIF",
                noHp: "088216706885",
                role: "GURU_MAPEL",
            },
            {
                nip: "45678",
                password: "guru45678",
                nama: "Kikin Saradela, S.Pd",
                email: "kikinsaradela85@gmail.com",
                status: "AKTIF",
                noHp: "087843067032",
                role: "WALI_KELAS",
            },
            {
                nip: "56789",
                password: "guru56789",
                nama: "Fathurroyani, S.Pd",
                email: "fhurroyani@gmail.com",
                status: "AKTIF",
                noHp: "085205755823",
                role: "WALI_KELAS",
            },
            {
                nip: "67890",
                password: "guru67890",
                nama: "Lilik Supiatni, S. Pd",
                email: "supiatnililik@gmail.com",
                status: "AKTIF",
                noHp: "087732881556",
                role: "WALI_KELAS",
            },
            {
                nip: "78901",
                password: "guru78901",
                nama: "Irwan Hadi, S.Pd",
                email: "iwenn0822@gmail.com",
                status: "AKTIF",
                noHp: "081933145010",
                role: "GURU_MAPEL",
            },
            {
                nip: "89012",
                password: "guru89012",
                nama: "Mujiburrohman, S.Pd",
                email: "mujiburrohman.nuris@gmail.com",
                status: "AKTIF",
                noHp: "085945668547",
                role: "GURU_MAPEL",
            },
            {
                nip: "90123",
                password: "guru90123",
                nama: "Anandita Ramdiani, S. Pd",
                email: "ramdianianandita@gmail.com",
                status: "AKTIF",
                noHp: "081775133864",
                role: "WALI_KELAS",
            },
            {
                nip: "11223",
                password: "guru11223",
                nama: "Roza Fadila, S. Pd",
                email: "rozafadila17@gmail.com",
                status: "AKTIF",
                noHp: "083189997297",
                role: "WALI_KELAS",
            },
            {
                nip: "22334",
                password: "guru22334",
                nama: "Muhammad Abdul Hadi, S.Pd",
                email: "mabdulhadi504@gmail.com",
                status: "AKTIF",
                noHp: "081809171254",
                role: "WALI_KELAS",
            },
            {
                nip: "33445",
                password: "guru33445",
                nama: "Retna Ayu Rachmawati, S.Pd",
                email: "retnaayu2003@gmail.com",
                status: "AKTIF",
                noHp: "087853279319",
                role: "WALI_KELAS",
            },
            {
                nip: "44556",
                password: "guru44556",
                nama: "Rakhmi Vegi Arizka, Lc",
                email: "rahmiarizka@gmail.com",
                status: "AKTIF",
                noHp: "081511391147",
                role: "GURU_MAPEL",
            },
            {
                nip: "55667",
                password: "guru55667",
                nama: "Minhajus Solihin, S.Pd",
                email: "minhajussolihin14@gmail.com",
                status: "AKTIF",
                noHp: "081805396012",
                role: "GURU_MAPEL",
            },
        ],
    });

    console.log("Data guru berhasil ditambahkan");
}

main()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });