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
            {
                nip: "55668",
                password: "guru55668",
                nama: "Sarniyati, S.Pd",
                email: "sarniyati2001@gmail.com",
                status: "AKTIF",
                noHp: "087855355266",
                role: "GURU_MAPEL",
            },
            {
                nip: "55669",
                password: "guru55669",
                nama: "Samsul Hadi, S.Pd",
                email: "Hadi47375@gmail.com",
                status: "AKTIF",
                noHp: "087859487738",
                role: "GURU_MAPEL",
            }
        ],
    });

    console.log("Data guru berhasil ditambahkan");

    // 1. Tahun Ajaran
    const tahunAjaran = await prisma.tahunAjaran.create({
        data: {
            nama: "2024/2025",
            isActive: true,
            mulai: new Date("2024-07-01"),
            selesai: new Date("2025-06-30"),
        }
    });
    console.log("Data Tahun Ajaran berhasil ditambahkan");

    // 2. Kelas
    const kelasNames = ["1A", "1B", "1C", "2A", "2B", "3A", "3B", "4", "5", "6"];
    const kelasData = await Promise.all(
        kelasNames.map(nama => prisma.kelas.create({ data: { nama } }))
    );
    const kelas1A = kelasData.find(k => k.nama === "1A");
    console.log("Data Kelas berhasil ditambahkan");

    // 3. Siswa & Penempatan Kelas (Dari file Excel)
    const studentsData = [
        {
            className: "1A",
            students: [
                { nama: "FARID ATALLAH DIRGANTARA", nis: "3183457080", jk: "L", ttl: "MATARAM, 2018-12-28", status: "AKTIF" },
                { nama: "SAEBATUL ASLAMIAH", nis: "3199803908", jk: "P", ttl: "MATARAM, 2019-01-05", status: "AKTIF" },
                { nama: "SAYYID ABDULLAH NUR SHOLEH", nis: "3165617967", jk: "L", ttl: "LOMBOK TIMUR, 2018-05-20", status: "AKTIF" },
                { nama: "NAYARA SHOFIA RIZANY", nis: "3197393153", jk: "P", ttl: "MATARAM, 2019-01-05", status: "AKTIF" },
                { nama: "MUHAMMAD YUSUF AMRULLAH", nis: "3198817380", jk: "L", ttl: "MATARAM, 2019-06-23", status: "AKTIF" },
                { nama: "ANNAILA LATIFFA BUDIHARJO", nis: "3197925946", jk: "P", ttl: "MATARAM, 2019-06-19", status: "AKTIF" },
                { nama: "ANIS LUKMAN AL FAIN", nis: "3191342809", jk: "L", ttl: "MATARAM, 2019-03-19", status: "AKTIF" },
                { nama: "FATIMAH AZ ZAHRA", nis: "3195341965", jk: "P", ttl: "MATARAM, 2019-01-03", status: "AKTIF" },
                { nama: "ADZRA HAFIZHAN HAMID", nis: "3195510589", jk: "L", ttl: "MATARAM, 2019-03-11", status: "AKTIF" },
                { nama: "FATTAN AULIAN SANJAYA", nis: "3191528360", jk: "L", ttl: "LOMBOK TENGAH, 2019-01-27", status: "AKTIF" },
                { nama: "SHAYLA DIVA GUNAWAN", nis: "3183787912", jk: "P", ttl: "MATARAM, 2018-10-04", status: "AKTIF" },
                { nama: "KAYLA AZZAHRA KHAIRUNNISA", nis: "3183015177", jk: "P", ttl: "MATARAM, 2018-09-24", status: "AKTIF" },
                { nama: "NOUVAL ALWI AL KHAZAN", nis: "3189252323", jk: "L", ttl: "MATARAM, 2018-11-05", status: "AKTIF" },
                { nama: "KAYLASH RAYSHIVA ADELLIO CETERIA", nis: "3187241838", jk: "L", ttl: "MATARAM, 2018-11-02", status: "AKTIF" },
                { nama: "RAHIMA KIASATINA MUBIINA", nis: "0000000005", jk: "P", ttl: "MATARAM, 2019-05-18", status: "AKTIF" },
                { nama: "MUHAMMAD ARTHANABIL ALFARIZQI", nis: "3193147415", jk: "L", ttl: "MATARAM, 2019-04-09", status: "AKTIF" },
                { nama: "MUHAMMAD FAHRI ARSYAD", nis: "3185541880", jk: "L", ttl: "MATARAM, 2018-05-29", status: "AKTIF" }
            ]
        },
        {
            className: "1B",
            students: [
                { nama: "MUHAMMAD KAMAYEL VALLIANT", nis: "3191494259", jk: "L", ttl: "BOGOR, 2019-01-26", status: "AKTIF" },
                { nama: "HAFIDZAH KHAIRUNNISA ARGAPUTRI", nis: "3184100533", jk: "P", ttl: "MATARAM, 2018-11-21", status: "AKTIF" },
                { nama: "KANINA KAIRA HIBATILLAH", nis: "3188812377", jk: "P", ttl: "SIGERONGAN, 2018-08-05", status: "AKTIF" },
                { nama: "AHMAD AHSAN ABIDBILLAH", nis: "3189313962", jk: "L", ttl: "MATARAM, 2018-12-11", status: "AKTIF" },
                { nama: "DEA NADHIRA ALMAHYRA", nis: "3182175569", jk: "P", ttl: "LOMBOK TIMUR, 2018-06-19", status: "AKTIF" },
                { nama: "MUHAMMAD FATIH AR RAYYAN", nis: "3182650792", jk: "L", ttl: "MATARAM, 2018-11-24", status: "AKTIF" },
                { nama: "SALINA AZAHRA", nis: "3198482282", jk: "P", ttl: "MATARAM, 2019-03-14", status: "AKTIF" },
                { nama: "AINA TALITA ZAHRA", nis: "3194638548", jk: "P", ttl: "TANJUNG, 2019-01-31", status: "AKTIF" },
                { nama: "JESI MIKAYLA AZ-ZAHRA", nis: "3197397197", jk: "P", ttl: "SAKRA, 2019-03-13", status: "AKTIF" },
                { nama: "SAFALUNA ATAYA QIYYAMA", nis: "3193612891", jk: "P", ttl: "MATARAM, 2019-05-26", status: "AKTIF" },
                { nama: "ASKANA QIRANI MUSNI", nis: "3198071690", jk: "P", ttl: "BATU LAYAR, 2019-05-09", status: "AKTIF" },
                { nama: "HANIF SAGARA ILMI", nis: "0000000004", jk: "L", ttl: "Tangerang Selatan, 2018-08-29", status: "AKTIF" },
                { nama: "LALU FIQRI ALI TANVIR", nis: "0000000003", jk: "L", ttl: "Mataram, 2018-09-17", status: "AKTIF" },
                { nama: "MUH RAFIF SHAREEM AL GHAZALI", nis: "3192729868", jk: "L", ttl: "MATARAM, 2019-03-15", status: "AKTIF" },
                { nama: "NAADHIRA KAMILA", nis: "3184536004", jk: "P", ttl: "MATARAM, 2018-09-08", status: "AKTIF" },
                { nama: "MUHAMMAD RAYHAN AL FARIZKY", nis: "3183223332", jk: "L", ttl: "MATARAM, 2018-09-01", status: "AKTIF" },
                { nama: "MUHAMMAD NENDRA AL KAHFI", nis: "3189524547", jk: "L", ttl: "MATARAM, 2018-02-20", status: "AKTIF" }
            ]
        },
        {
            className: "1C",
            students: [
                { nama: "PUTRI LATHIFAH", nis: "3190444160", jk: "P", ttl: "MATARAM, 2019-01-30", status: "AKTIF" },
                { nama: "MUHAMMAD AZZAM JUNAIDI", nis: "3189404307", jk: "L", ttl: "DEPOK, 2018-05-11", status: "AKTIF" },
                { nama: "SUDAIS AL HUMAIDI", nis: "3183102657", jk: "L", ttl: "MATARAM, 2018-04-19", status: "AKTIF" },
                { nama: "QAIREEN QAISARA SHANUM", nis: "3197102063", jk: "P", ttl: "MATARAM, 2019-02-12", status: "AKTIF" },
                { nama: "HANUM HANANIA AHMAD", nis: "3190629239", jk: "P", ttl: "MATARAM, 2019-03-13", status: "AKTIF" },
                { nama: "NATHAN GHIFARI ALFARIZKI AB", nis: "3186391717", jk: "L", ttl: "MATARAM, 2018-07-12", status: "AKTIF" },
                { nama: "SHAZIA MIKAYLA NURMAULIDA", nis: "3185376277", jk: "P", ttl: "MATARAM, 2018-11-15", status: "AKTIF" },
                { nama: "MUHAMMAD HANIF AL FARABBI", nis: "3186710708", jk: "L", ttl: "MATARAM, 2018-11-10", status: "AKTIF" },
                { nama: "HIMEKA TAVISHA ARMINA", nis: "3181807452", jk: "P", ttl: "MATARAM, 2018-06-11", status: "AKTIF" },
                { nama: "ABYAN ZAKIR", nis: "0000000001", jk: "L", ttl: "Mataram, 2018-11-05", status: "AKTIF" },
                { nama: "KHABIB ZIKRI ISKANDAR", nis: "0000000002", jk: "L", ttl: "Mataram, 2018-11-02", status: "AKTIF" },
                { nama: "KHALIF NUHA KARTIKAYADI", nis: "3196450299", jk: "L", ttl: "MATARAM, 2019-01-09", status: "AKTIF" },
                { nama: "MARITSA AZALEA PUTRI", nis: "3180849534", jk: "P", ttl: "MATARAM, 2018-07-26", status: "AKTIF" },
                { nama: "RAYYA MAISA", nis: "3193837839", jk: "P", ttl: "MATARAM, 2019-01-22", status: "AKTIF" },
                { nama: "NAJWA HAYATUN THOYYIBAH", nis: "3181245153", jk: "P", ttl: "MATARAM, 2018-05-21", status: "AKTIF" },
                { nama: "MUHAMMAD ZUFAR HANIF FIKRI", nis: "3185317373", jk: "L", ttl: "MATARAM, 2018-01-09", status: "AKTIF" }
            ]
        },
        {
            className: "2A",
            students: [
                { nama: "NEGARA AL HAFIDZ NUR ADRIAN", nis: "3182426885", jk: "L", ttl: "MATARAM, 2018-02-02", status: "AKTIF" },
                { nama: "MUHAMMAD FARID RIZKI ZADIN", nis: "3171145842", jk: "L", ttl: "MATARAM, 2017-12-05", status: "AKTIF" },
                { nama: "SALMAN UBAIDILLAH ASHARI", nis: "3177605945", jk: "L", ttl: "SUMBAWA BESAR, 2017-11-27", status: "AKTIF" },
                { nama: "AZZAHRA", nis: "3186885671", jk: "P", ttl: "CAIRO, 2018-05-29", status: "AKTIF" },
                { nama: "ALESHA GHINA ARKATA", nis: "3189986671", jk: "P", ttl: "MATARAM, 2018-05-15", status: "AKTIF" },
                { nama: "ANINDA SHAFIRA HAWARI", nis: "3172738932", jk: "P", ttl: "KEDIRI, 2017-12-06", status: "AKTIF" },
                { nama: "RALINEA ADILA TAQIYA", nis: "3172502251", jk: "P", ttl: "MATARAM, 2017-12-21", status: "AKTIF" },
                { nama: "BAIQ ARSYILA KEYSHA SYAHANA", nis: "3179556199", jk: "P", ttl: "MATARAM, 2017-07-14", status: "AKTIF" },
                { nama: "AKHTAR ALFARUQ WIJAYA", nis: "3182113376", jk: "L", ttl: "LOMBOK BARAT, 2018-02-15", status: "AKTIF" },
                { nama: "AZKA DZAKY ZAFRAN ALFARIZQI", nis: "3187089797", jk: "L", ttl: "PALANGKARYA, 2018-03-24", status: "AKTIF" },
                { nama: "BAIQ ALMAHYRA QONITA AZZAHRA", nis: "3189698706", jk: "P", ttl: "MATARAM, 2018-07-22", status: "AKTIF" },
                { nama: "BAIQ GADIS MAYSHA ANDINI", nis: "3185141049", jk: "P", ttl: "MATARAM, 2018-05-25", status: "AKTIF" },
                { nama: "MUHAMMAD TANGGUH ALFATIH", nis: "3183366428", jk: "L", ttl: "KEKERI, 2018-04-26", status: "AKTIF" }
            ]
        },
        {
            className: "2B",
            students: [
                { nama: "ADITYA RIZKI RAMADHON", nis: "3170194299", jk: "L", ttl: "LOMBOK TENGAH, 2017-06-24", status: "AKTIF" },
                { nama: "RAFAILA NOOR AFIDZA", nis: "3176704273", jk: "P", ttl: "MATARAM, 2017-09-17", status: "AKTIF" },
                { nama: "ISMAIL ABDUR RASYID", nis: "3174944776", jk: "L", ttl: "MATARAM, 2017-12-04", status: "AKTIF" },
                { nama: "TALIA SOFEA MAS PUTRI PENA", nis: "0189020325", jk: "P", ttl: "MATARAM, 2018-02-19", status: "AKTIF" },
                { nama: "ALULA KIARRA SALSABILA", nis: "3173833658", jk: "P", ttl: "MATARAM, 2017-07-21", status: "AKTIF" },
                { nama: "APRILIA ZHIVANA SOBRI", nis: "3181099954", jk: "P", ttl: "MATARAM, 2018-04-25", status: "AKTIF" },
                { nama: "ARFAN HADI MAULANA", nis: "3172547831", jk: "L", ttl: "MATARAM, 2017-09-17", status: "AKTIF" },
                { nama: "ADIPATI AHTAR SAID", nis: "3176941128", jk: "L", ttl: "MATARAM, 2017-10-11", status: "AKTIF" },
                { nama: "MAHIRA FIKRIA RUMAISHA", nis: "3175817441", jk: "P", ttl: "MAGELANG, 2017-10-19", status: "AKTIF" },
                { nama: "YOGA PRATAMA SATRIA WIRAWAN", nis: "3179633917", jk: "L", ttl: "LOMBOK BARAT, 2017-05-27", status: "AKTIF" },
                { nama: "OKTAVIA ZAINA FATIMAH", nis: "3179927985", jk: "P", ttl: "MATARAM, 2017-10-08", status: "AKTIF" },
                { nama: "ARSYILA DESWINA KINANTI", nis: "3177688019", jk: "P", ttl: "MATARAM, 2017-12-17", status: "AKTIF" },
                { nama: "ARANSHA DIKRAN ALHANAN", nis: "3172920902", jk: "L", ttl: "MATARAM, 2017-10-21", status: "AKTIF" },
                { nama: "ALI MUHAMMAD AL FAIN", nis: "3171005540", jk: "L", ttl: "MATARAM, 2017-11-15", status: "AKTIF" }
            ]
        },
        {
            className: "3A",
            students: [
                { nama: "SHOFIYAH FARHAN BAHANAN", nis: "3161242483", jk: "P", ttl: "BANYUWANGI, 2016-05-02", status: "AKTIF" },
                { nama: "UMMAY ALI GABRIEL", nis: "0163559851", jk: "L", ttl: "MATARAM, 2016-06-02", status: "AKTIF" },
                { nama: "MUHAMAD BARIQ HABIBULLAH", nis: "3164087753", jk: "L", ttl: "MATARAM, 2016-10-31", status: "AKTIF" },
                { nama: "NARUNA HANIF SGAZANI", nis: "3173660282", jk: "L", ttl: "MATARAM, 2017-02-03", status: "AKTIF" },
                { nama: "KHALID ALI FIKRI", nis: "3173412932", jk: "L", ttl: "MATARAM, 2017-01-27", status: "AKTIF" },
                { nama: "ABID AL DEVARO RAJENDRA", nis: "3171059481", jk: "L", ttl: "MATARAM, 2017-05-30", status: "AKTIF" },
                { nama: "ALKA VIJAYASHREE MARYAM", nis: "3167727133", jk: "P", ttl: "MATARAM, 2016-02-19", status: "AKTIF" },
                { nama: "AHMAD BILAL ALBIRRU", nis: "3176684458", jk: "L", ttl: "MATARAM, 2017-05-18", status: "AKTIF" },
                { nama: "KALEA DINARA SAKHI", nis: "3170719541", jk: "P", ttl: "MATARAM, 2017-03-28", status: "AKTIF" },
                { nama: "ALIF KELANA ILMI", nis: "3164705048", jk: "L", ttl: "TANGERANG SELATAN, 2016-10-06", status: "AKTIF" },
                { nama: "ARSYANA AZZAHRA FAWWAZ", nis: "3178806337", jk: "P", ttl: "MATARAM, 2017-04-13", status: "AKTIF" },
                { nama: "AISYAH FIKRIA NAUFALYN", nis: "3165036628", jk: "P", ttl: "SLEMAN, 2016-05-01", status: "AKTIF" },
                { nama: "LUBNA SYAFIRA", nis: "3161235574", jk: "P", ttl: "MATARAM, 2016-10-07", status: "AKTIF" },
                { nama: "HANNA KHAERUNNISA", nis: "3178847644", jk: "P", ttl: "TANGERANG SELATAN, 2017-05-03", status: "AKTIF" },
                { nama: "SALWA QISTHI ADZKIYA", nis: "3179298270", jk: "P", ttl: "MATARAM, 2017-02-03", status: "AKTIF" }
            ]
        },

        {
            className: "3B",
            students: [
                { nama: "YURIKA ASHILA", nis: "3173205321", jk: "P", ttl: "MATARAM, 2017-01-17", status: "AKTIF" },
                { nama: "CALISTA OKTAVIANDA ARIASENA", nis: "3151169910", jk: "P", ttl: "MATARAM, 2016-10-19", status: "AKTIF" },
                { nama: "QIMORA ASHIMA MIKAYLA", nis: "3160581907", jk: "P", ttl: "MATARAM, 2016-11-13", status: "AKTIF" },
                { nama: "LALU DZIKRI AL ADSKHAN", nis: "3175051729", jk: "L", ttl: "MATARAM, 2017-01-08", status: "AKTIF" },
                { nama: "SYAKIRA MAJIDA MANSYUR", nis: "3161381796", jk: "P", ttl: "MATARAM, 2016-11-10", status: "AKTIF" },
                { nama: "MUHAMMAD GHAZALI AKBAR", nis: "3175435180", jk: "L", ttl: "MATARAM, 2017-02-04", status: "AKTIF" },
                { nama: "MUHAMMAD ARIQ ALHAFIDZI", nis: "3161458572", jk: "L", ttl: "MATARAM, 2016-05-02", status: "AKTIF" },
                { nama: "ATAULLAH AKBAR", nis: "3179555852", jk: "L", ttl: "MATARAM, 2017-03-01", status: "AKTIF" },
                { nama: "KHANZA VIDHEA WAHYUDI", nis: "3173007517", jk: "P", ttl: "MATARAM, 2017-03-07", status: "AKTIF" },
                { nama: "ABDERAL ZAFRAN AL-HASAN", nis: "3169669702", jk: "L", ttl: "MATARAM, 2016-07-27", status: "AKTIF" },
                { nama: "MUHAMMAD ABID SYAMIL WARDHANA", nis: "3170889526", jk: "L", ttl: "MATARAM, 2017-05-23", status: "AKTIF" },
                { nama: "MARYAM EDELWEIS", nis: "3166923629", jk: "P", ttl: "MATARAM, 2016-11-01", status: "AKTIF" },
                { nama: "ADZKIA SALSABILA PRASETYO", nis: "3166835934", jk: "P", ttl: "JIMBARAN, 2016-08-29", status: "AKTIF" },
                { nama: "HAFIZA GANIA", nis: "3164778816", jk: "P", ttl: "MATARAM, 2016-09-01", status: "AKTIF" },
                { nama: "ASHALINA SABHIRA ALTAF", nis: "3168934244", jk: "P", ttl: "MATARAM, 2016-11-26", status: "AKTIF" }
            ]
        },

        {
            className: "4",
            students: [
                // Dari 4A
                { nama: "ALULA KHANSA RAFANI", nis: "3164864315", jk: "P", ttl: "MATARAM, 2016-01-09", status: "AKTIF" },
                { nama: "NADI FATHIYATUL RIZKIA AFZA", nis: "3157661833", jk: "P", ttl: "MATARAM, 2015-08-28", status: "AKTIF" },
                { nama: "AISYAH NUHA ZAHIRA", nis: "3164405094", jk: "P", ttl: "LINGSAR, 2016-02-25", status: "AKTIF" },
                { nama: "ALFIRA AULIA SETYARINI", nis: "3151516995", jk: "P", ttl: "MATARAM, 2015-09-08", status: "AKTIF" },
                { nama: "RADELLA ERZAFARA", nis: "3166534557", jk: "P", ttl: "MATARAM, 2016-01-30", status: "AKTIF" },
                { nama: "FATHAN GHALIBIE ISKANDAR", nis: "3152100149", jk: "L", ttl: "SELONG, 2015-03-18", status: "AKTIF" },
                { nama: "NAZRIEL ALKHALIFI NURWAHYUDI", nis: "3166413084", jk: "L", ttl: "MATARAM, 2016-08-09", status: "AKTIF" },
                { nama: "QUENESHA ULYA ANNAZIFA", nis: "3164734756", jk: "P", ttl: "LOMBOK TIMUR, 2016-01-22", status: "AKTIF" },
                { nama: "MUHAMAD ALKHALIFI IBRAHIM", nis: "3154852465", jk: "L", ttl: "MATARAM, 2015-06-26", status: "AKTIF" },
                { nama: "ALESHA CORDELIA RAFANI", nis: "3159404463", jk: "P", ttl: "MATARAM, 2015-08-27", status: "AKTIF" },
                { nama: "AYSHA FAKHIRA HAMIDAH", nis: "3166097424", jk: "P", ttl: "MATARAM, 2016-05-25", status: "AKTIF" },
                { nama: "DIRGANTARA AUFA HARTLAN", nis: "3155700752", jk: "L", ttl: "MATARAM, 2015-05-08", status: "AKTIF" },
                { nama: "DZIKRA OLIVIA NAURA", nis: "3157028980", jk: "P", ttl: "MALANG, 2015-04-28", status: "AKTIF" },
                { nama: "HANA AIDINA KHALIKA", nis: "3153285764", jk: "P", ttl: "MATARAM, 2015-07-29", status: "AKTIF" },
                { nama: "ALYANDRA ZULFAHMI NADJA ABQHARY", nis: "3166554351", jk: "L", ttl: "MATARAM, 2016-09-28", status: "AKTIF" },
                // Dari 4B
                { nama: "ADZKIA SHAUMDITA HIDAYAT", nis: "3169209223", jk: "P", ttl: "MATARAM, 2016-06-03", status: "AKTIF" },
                { nama: "QORRY SYLVIA RAMADHANI", nis: "0152672132", jk: "P", ttl: "MATARAM, 2015-07-09", status: "AKTIF" },
                { nama: "BAIQ AISYAH MUTIA ZAHRA", nis: "3165123863", jk: "P", ttl: "MATARAM, 2016-05-17", status: "AKTIF" },
                { nama: "ARSYILA MEDINA", nis: "3162084406", jk: "P", ttl: "MATARAM, 2016-04-12", status: "AKTIF" },
                { nama: "ALYRA AZANIA RAQIQAH", nis: "3164050259", jk: "P", ttl: "MATARAM, 2016-04-19", status: "AKTIF" },
                { nama: "LALU MOCHAMAD AZKA", nis: "3151305861", jk: "L", ttl: "PENIMBUNG, 2015-08-15", status: "AKTIF" },
                { nama: "MUHAMMAD AL-GHAZALI", nis: "3152304100", jk: "L", ttl: "MATARAM, 2015-04-03", status: "AKTIF" },
                { nama: "MUHAMMAD FARUQ DHIYA'ULHAQ ATTHABRANI", nis: "3157223681", jk: "L", ttl: "MATARAM, 2015-10-26", status: "AKTIF" },
                { nama: "MISYARI RASYID", nis: "3153597122", jk: "L", ttl: "MATARAM, 2015-03-03", status: "AKTIF" },
                { nama: "BAIQ AFIKA RAFA HUMAIRA", nis: "3157574250", jk: "P", ttl: "MATARAM, 2015-12-27", status: "AKTIF" },
                { nama: "BASIMA NUR SHALIHA", nis: "3161987206", jk: "P", ttl: "LOMBOK TIMUR, 2016-04-22", status: "AKTIF" },
                { nama: "FAUZAN NABILUL UBAID", nis: "3159753547", jk: "L", ttl: "MOJOKERTO, 2015-06-03", status: "AKTIF" }
            ]
        },

        {
            className: "5",
            students: [
                { nama: "UMAR SUNGKAR", nis: "3144696598", jk: "L", ttl: "MATARAM, 2014-10-20", status: "AKTIF" },
                { nama: "AFIFAH FITIYA MAHARANI", nis: "3144221396", jk: "P", ttl: "MATARAM, 2014-04-16", status: "AKTIF" },
                { nama: "AISHA SHAFIYYAH HUSNA EFFENDY", nis: "3158159657", jk: "P", ttl: "MATARAM, 2015-03-23", status: "AKTIF" },
                { nama: "PRABU MAHESYA AARON", nis: "3157947805", jk: "L", ttl: "MATARAM, 2015-04-26", status: "AKTIF" },
                { nama: "MUHAMAD BENIE BASWARA", nis: "3146856582", jk: "L", ttl: "MATARAM, 2014-05-28", status: "AKTIF" },
                { nama: "BAIQ KHANSA KAMILA", nis: "0141767323", jk: "P", ttl: "MATARAM, 2014-12-20", status: "AKTIF" },
                { nama: "CINTYA RIZKI AMELIA", nis: "0159476785", jk: "P", ttl: "MATARAM, 2015-01-13", status: "AKTIF" },
                { nama: "AZZURA QUEENSA ISWOYO", nis: "0149287517", jk: "P", ttl: "MATARAM, 2014-11-14", status: "AKTIF" },
                { nama: "AHMAD SYAFIQ ZAIDAN FIKRI", nis: "3154289925", jk: "L", ttl: "MATARAM, 2015-05-27", status: "AKTIF" }
            ]
        },

        {
            className: "6",
            students: [
                { nama: "KHANSA SYAQILLA ALMAHYRA", nis: "3142403320", jk: "P", ttl: "MATARAM, 2014-07-11", status: "AKTIF" },
                { nama: "ALYSSA AZZAHRA MAULIDA", nis: "3143904272", jk: "P", ttl: "MATARAM, 2014-02-29", status: "AKTIF" },
                { nama: "BAIQ ZALFA AZZAHRA", nis: "3149706563", jk: "P", ttl: "MATARAM, 2014-06-05", status: "AKTIF" },
                { nama: "ERWADI MUHAMMAD ZABRAN ALIBASTH", nis: "3147958456", jk: "L", ttl: "MATARAM, 2014-06-13", status: "AKTIF" },
                { nama: "HAIKAL RIZQI PRADITA", nis: "0148277625", jk: "L", ttl: "MATARAM, 2014-02-23", status: "AKTIF" },
                { nama: "LALU IBRAHIM ABDUL JABBAR", nis: "3144118980", jk: "L", ttl: "MATARAM, 2014-06-25", status: "AKTIF" },
                { nama: "LALU MUHAMMAD NAZRAN ALFIN", nis: "3142888760", jk: "L", ttl: "MATARAM, 2014-08-30", status: "AKTIF" },
                { nama: "MUHAMMAD ALRAZI", nis: "0138119180", jk: "L", ttl: "MATARAM, 2015-02-12", status: "AKTIF" },
                { nama: "MUHAMMAD RAZIQ HANNAN MURSANA PUTRA", nis: "0149086649", jk: "L", ttl: "BALI SUMBAWA, 2014-09-03", status: "AKTIF" },
                { nama: "MUHAMMAD RIFQI HIDAYATULLAH", nis: "3139734367", jk: "L", ttl: "MATARAM, 2013-05-08", status: "AKTIF" },
                { nama: "NABIL ILMAN", nis: "0137676567", jk: "L", ttl: "PINA, 2015-11-27", status: "AKTIF" },
                { nama: "NADI NAYLA SYIFAUL KHAFIFA", nis: "3144870440", jk: "P", ttl: "MATARAM, 2014-01-30", status: "AKTIF" },
                { nama: "NATHISA QODARUL YUMNA", nis: "3138922251", jk: "P", ttl: "MATARAM, 2013-10-28", status: "AKTIF" },
                { nama: "ANDRE HAIDAR AL GHANIY", nis: "3138466491", jk: "L", ttl: "MATARAM, 2013-06-29", status: "AKTIF" },
                { nama: "AQILLA BIANCA NAURA", nis: "3149826706", jk: "P", ttl: "DENPASAR, 2014-01-01", status: "AKTIF" },
                { nama: "RIZKY RENDRA PRATAMA", nis: "0134130089", jk: "L", ttl: "MALITBUK, 2015-06-28", status: "AKTIF" },
                { nama: "SUBAYYIN EL-SYARAWY", nis: "3145573594", jk: "L", ttl: "MATARAM, 2014-02-07", status: "AKTIF" },
                { nama: "LALU MUHAMMAD AUFAR EL FATHIN FATHIN", nis: "0132577251", jk: "L", ttl: "ELBI, 2015-03-25", status: "AKTIF" },
                { nama: "ZHAFRAN AHMAD ARANTA", nis: "0149878425", jk: "L", ttl: "MATARAM, 2014-09-02", status: "AKTIF" },
                { nama: "FAEYZA PATHAR HADI", nis: "3135777283", jk: "L", ttl: "WARAWASA, 2015-11-07", status: "AKTIF" },
                { nama: "RATIFA ZAHRA HUMAIRA", nis: "0137633473", jk: "P", ttl: "MATARAM, 2015-12-01", status: "AKTIF" },
                { nama: "DZIHNI NAIFA ARIFANY FIKRI", nis: "3135227241", jk: "P", ttl: "MATARAM, 2015-04-07", status: "AKTIF" }
            ]
        }
    ];

    for (const group of studentsData) {
        const kelasObj = kelasData.find(k => k.nama === group.className);
        if (!kelasObj) {
            console.log(`Kelas ${group.className} tidak ditemukan!`);
            continue;
        }

        let addedCount = 0;
        for (const s of group.students) {
            const createdSiswa = await prisma.siswa.create({
                data: {
                    nama: s.nama,
                    nis: s.nis,
                    jk: s.jk as "L" | "P",
                    ttl: s.ttl,
                    status: s.status as "AKTIF" | "NONAKTIF"
                }
            });

            await prisma.siswaKelas.create({
                data: {
                    siswaId: createdSiswa.id,
                    kelasId: kelasObj.id,
                    tahunAjaranId: tahunAjaran.id
                }
            });
            addedCount++;
        }
        console.log(`Berhasil menambahkan ${addedCount} siswa ke kelas ${group.className}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });