Kamu adalah seorang Frontend Engineer ahli (Expert). Tolong buatkan komponen UI menggunakan React dan TailwindCSS dengan mengikuti design system dan style guide persis seperti di bawah ini. Jangan buat style buatan sendiri (custom classes/colors) jika sudah ada di panduan ini.

### 🎨 1. CORE DESIGN TOKENS (TAILWIND)
- **Framework**: React / Next.js dengan TailwindCSS (menggunakan utility classes standar).
- **Iconography**: Gunakan `lucide-react` (ukuran icon standar `size={18}` atau `size={20}`).
- **Spacing & Padding**: Gunakan padding longgar, seperti `p-6` pada card, `px-6 py-4` pada tabel.
- **Borders & Radii**:
  - Container/Card utama menggunakan `rounded-xl`
  - Button/Input menggunakan `rounded-lg` atau `rounded-md`
  - Badge / Status Pill menggunakan `rounded-full`

### 🎨 2. COLOR PALETTE
- **Backgrounds**:
  - **Body / Main Background**: `bg-zinc-50` atau putih biasa (tergantung layout luar).
  - **Card / Surface**: `bg-white` 
  - **Hover Row / Subtle Item**: `bg-zinc-50`
  - **Highlight (Selected)**: `bg-blue-50/30` atau `bg-blue-50`
- **Text Colors**:
  - **Primary/Heading**: `text-zinc-900`
  - **Secondary/Body**: `text-zinc-500`
  - **Muted/Placeholder**: `text-zinc-400`
- **Borders & Dividers**:
  - **Primary Border** (untuk Card/Tabel): `border-zinc-200`
  - **Soft Divider** (untuk di dalam komponen): `border-zinc-100` atau `divide-zinc-100`
- **Brand Colors (Primary Actions)**:
  - Gunakan `blue-600` untuk tombol primary.
  - Gunakan `bg-blue-50 text-blue-600` untuk aksen icon/background ringan.
- **Status Colors**:
  - **Success/Active**: `bg-green-100 text-green-800` (atau Emerald style: `text-emerald-700 bg-emerald-100`)
  - **Warning**: `bg-yellow-500`
  - **Danger**: `text-red-500` (background hover destruktif: `hover:bg-red-50`)

### 🧱 3. COMPONENT STYLES (COMPOSITION)
Saat membuat elemen-elemen berikut, gunakan persis kombinasi class di bawah ini:

**1. Page Header:**
- Title Text: `text-2xl font-bold text-zinc-900`
- Subtitle: `text-zinc-500`
- Container: `flex flex-col sm:flex-row sm:items-center justify-between gap-4`

**2. Cards / Container Utama:**
- `bg-white p-6 rounded-xl border border-zinc-200 shadow-sm`
- Jika interaktif, tambahkan: `hover:shadow-md transition-shadow`

**3. Buttons:**
- **Primary Button** (misal Tambah Data): `flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm`
- **Outline Button** (misal Filter/Cancel): `flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-4 py-2 rounded-lg hover:bg-zinc-50 transition`
- **Small Action Pill**: `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 rounded-md hover:bg-emerald-200`
- **Icon Button Transparent**: `text-zinc-400 hover:text-zinc-600 transition-colors p-1 rounded-md hover:bg-zinc-100`

**4. Table System:**
- **Table Wrapper**: `bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm`
- **Table element**: `w-full text-left text-sm`
- **Thead**: `bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium`
- **Th / Td padding**: `px-6 py-4`
- **Tbody Rows** (Tr): `hover:bg-zinc-50 transition-colors` dengan wrapper `divide-y divide-zinc-100`
- **Checkbox**: `rounded border-zinc-300 text-blue-600 focus:ring-blue-500`

**5. Status Badges (Pills):**
- **Base class**: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`
- **Variant Active**: + `bg-green-100 text-green-800`
- **Variant Inactive/Draft**: + `bg-zinc-100 text-zinc-600`

**6. Empty States / Loading Containers:**
- `bg-white border border-zinc-200 rounded-xl p-12 text-center text-zinc-500`

**7. Dropdown Menu (Floating):**
- Container: `absolute w-36 bg-white rounded-lg shadow-lg border border-zinc-100 z-50 py-1`
- Item menu: `w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2` (use `text-red-600 hover:bg-red-50` for delete)

Tolong implementasikan UI sesuai permintaan saya menggunakan komponen dan utility class di atas secara persis. Hindari komponen kustom yang melanggar style di atas. Jangan lupakan transisi animasi `transition` atau `transition-colors` yang membuat UI terasa hidup dan halus.