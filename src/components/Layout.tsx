import React, { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LogOut,
  LayoutDashboard,
  Users,
  UserCog,
  ClipboardCheck,
  BarChart2,
  FileText,
  BookOpen,
  LucideIcon,
  ArrowLeft,
  Star,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";

export type NavItem = { label: string; href: string; icon: LucideIcon };

interface LayoutProps {
  children: ReactNode;
  role: "teacher" | "admin" | "principal" | "parent";
  hasSidebar?: boolean;
  customNavItems?: NavItem[];
}

const ROLE_CONFIG = {
  admin: {
    name: "Admin Utama",
    subtitle: "Administrator",
    initials: "AD",
    fullName: "Admin Utama",
    nip: "—",
    email: "admin@sekolah.sch.id",
    headerLabel: "Sistem Informasi Manajemen Sekolah",
    sidebarLabel: "Menu Admin",
    homePath: "/admin",
    defaultNav: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Data Guru", href: "/admin/teachers", icon: UserCog },
      { label: "Data Siswa", href: "/admin/students", icon: Users },
      {
        label: "Tahun Ajaran",
        href: "/admin/academic-years",
        icon: CalendarDays,
      },
      {
        label: "Evaluasi",
        href: "/admin/evaluation",
        icon: Star,
      },
    ],
  },
  teacher: {
    name: "Guru",
    subtitle: "Pengajar",
    initials: "G",
    fullName: "Guru",
    nip: "—",
    email: "—",
    headerLabel: "Portal Akademik Guru",
    sidebarLabel: "Menu Kelas",
    homePath: "/teacher",
    getNav: (classId: string) => [
      {
        label: "Tandai Kehadiran",
        href: `/teacher/class/${classId}/attendance`,
        icon: ClipboardCheck,
      },
      {
        label: "Rekap Kehadiran",
        href: `/teacher/class/${classId}/rekap`,
        icon: BarChart2,
      },
      {
        label: "Buku Penghubung",
        href: `/teacher/class/${classId}/connector`,
        icon: BookOpen,
      },
    ],
  },
  principal: {
    name: "Dr. Hj. Siti Maryam",
    subtitle: "Kepala Sekolah",
    initials: "SM",
    fullName: "Dr. Hj. Siti Maryam, M.Pd",
    nip: "197201031998032004",
    email: "kepsek@sekolah.sch.id",
    headerLabel: "Dashboard Kepala Sekolah",
    sidebarLabel: "Menu Kepala Sekolah",
    homePath: "/principal/attendance",
    defaultNav: [
      {
        label: "Analisis Kehadiran",
        href: "/principal/attendance",
        icon: ClipboardCheck,
      },
      {
        label: "Analisis Evaluasi",
        href: "/principal/reports",
        icon: BarChart2,
      },
    ],
  },
  parent: {
    name: "Ibu Rina Kusuma",
    subtitle: "Orang Tua",
    initials: "RK",
    fullName: "Rina Kusuma",
    nip: "—",
    email: "rina.kusuma@gmail.com",
    headerLabel: "Portal Orang Tua",
    sidebarLabel: "Menu",
    homePath: "/parent/attendance",
    defaultNav: [
      {
        label: "Ajukan Izin",
        href: "/parent/permission",
        icon: FileText,
      },
      {
        label: "Rekap Kehadiran",
        href: "/parent/attendance",
        icon: ClipboardCheck,
      },
      {
        label: "Evaluasi",
        href: "/parent/evaluation",
        icon: BarChart2,
      },
    ],
  },
};

// ── SidebarContent: komponen luar (bukan di-render dalam render) ───────────────
interface SidebarContentProps {
  role: string;
  navItems: NavItem[];
  homePath: string;
  sidebarLabel: string;
  currentPath: string;
  onNavigate: (path: string) => void;
}

function SidebarContent({
  role,
  navItems,
  homePath,
  sidebarLabel,
  currentPath,
  onNavigate,
}: SidebarContentProps) {
  return (
    <>
      {/* Logo / Brand */}
      <div
        className="h-16 flex items-center px-6 border-b border-zinc-200 shrink-0 cursor-pointer"
        onClick={() => onNavigate(homePath)}
      >
        <span className="font-bold text-lg text-zinc-900 flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="w-9 h-9" />
          Sistem<span className="text-blue-600">Absen</span>
        </span>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* Tombol Back ke My Class (hanya untuk guru) */}
        {role === "teacher" && (
          <button
            onClick={() => onNavigate("/teacher")}
            className="w-full flex items-center gap-2 px-3 py-2 mb-4 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 border border-zinc-200 transition-colors"
          >
            <ArrowLeft size={16} className="text-zinc-400" />
            Kembali ke My Class
          </button>
        )}

        <div className="text-xs font-semibold text-zinc-400 mb-4 px-2 uppercase tracking-wide">
          {sidebarLabel}
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-blue-50 text-blue-600" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"}`}
              >
                <item.icon
                  size={18}
                  className={isActive ? "text-blue-600" : "text-zinc-400"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-zinc-200 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-500 rounded-lg hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Keluar
        </Link>
      </div>
    </>
  );
}

export function Layout({
  children,
  role,
  hasSidebar = true,
  customNavItems,
}: LayoutProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const profileRef = React.useRef<HTMLDivElement>(null);

  // State untuk menyimpan data guru dan orang tua dinamis
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dynamicTeacher, setDynamicTeacher] = React.useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dynamicParent, setDynamicParent] = React.useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dynamicPrincipal, setDynamicPrincipal] = React.useState<any>(null);

  // State form ganti password
  const [showPwForm, setShowPwForm] = React.useState(false);
  const [pwOld, setPwOld] = React.useState("");
  const [pwNew, setPwNew] = React.useState("");
  const [pwConfirm, setPwConfirm] = React.useState("");
  const [pwLoading, setPwLoading] = React.useState(false);
  const [pwError, setPwError] = React.useState("");
  const [pwSuccess, setPwSuccess] = React.useState("");

  // Tutup sidebar saat route berubah (navigasi di mobile)
  React.useEffect(() => {
    setSidebarOpen(false);
    setProfileOpen(false);
  }, [router.asPath]);

  // Tutup popover profil saat klik di luar
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileOpen]);

  // Cegah scroll body saat sidebar mobile terbuka
  React.useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  React.useEffect(() => {
    let isMounted = true;

    if (role === "teacher") {
      // Prioritaskan cookie untuk respons instan
      if (typeof document !== "undefined") {
        const match = document.cookie.match(
          new RegExp("(^| )userName=([^;]+)"),
        );
        if (match && match[2]) {
          const name = decodeURIComponent(match[2]);
          if (isMounted) setDynamicTeacher({ name, nip: "—" });
        }
      }

      // Ambil data asli dari API untuk melengkapi NIP dsb.
      const fetchMe = async () => {
        try {
          const res = await fetch("/api/teacher/me");
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.teacher && isMounted) {
              setDynamicTeacher(data.teacher);
            }
          }
        } catch (error) {
          console.error("Failed to fetch teacher for layout", error);
        }
      };
      fetchMe();
    }

    if (role === "parent") {
      // Prioritaskan cookie untuk nama instan
      if (typeof document !== "undefined") {
        const match = document.cookie.match(
          new RegExp("(^| )userName=([^;]+)"),
        );
        if (match && match[2]) {
          const name = decodeURIComponent(match[2]);
          if (isMounted) setDynamicParent({ parent: { name }, child: null });
        }
      }

      // Ambil data lengkap orang tua + anak dari API
      const fetchParent = async () => {
        try {
          const res = await fetch("/api/parent/me");
          if (res.ok) {
            const data = await res.json();
            if (data.success && isMounted) {
              setDynamicParent(data);
            }
          }
        } catch (error) {
          console.error("Failed to fetch parent for layout", error);
        }
      };
      fetchParent();
    }

    if (role === "principal") {
      // Baca nama dari cookie untuk respons instan
      if (typeof document !== "undefined") {
        const match = document.cookie.match(
          new RegExp("(^| )userName=([^;]+)"),
        );
        if (match && match[2]) {
          const name = decodeURIComponent(match[2]);
          if (isMounted) setDynamicPrincipal({ name, nip: "—" });
        }
      }

      // Ambil data lengkap dari API (Guru tabel, role KEPALA_SEKOLAH)
      const fetchPrincipal = async () => {
        try {
          const res = await fetch("/api/teacher/me");
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.teacher && isMounted) {
              setDynamicPrincipal(data.teacher);
            }
          }
        } catch (error) {
          console.error("Failed to fetch principal for layout", error);
        }
      };
      fetchPrincipal();
    }

    return () => {
      isMounted = false;
    };
  }, [role]);

  const config = { ...ROLE_CONFIG[role] };

  // Override config dengan data guru dinamis
  if (role === "teacher" && dynamicTeacher) {
    config.name = dynamicTeacher.name;
    config.fullName = dynamicTeacher.name;
    config.nip = dynamicTeacher.nip;
    config.email = dynamicTeacher.email;

    // Generate inisial (misal: Budi Santoso -> BS)
    const words = dynamicTeacher.name.split(" ");
    if (words.length > 1) {
      config.initials = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      config.initials = dynamicTeacher.name.substring(0, 2).toUpperCase();
    }
  }

  // Override config dengan data orang tua dinamis
  if (role === "parent" && dynamicParent?.parent) {
    const p = dynamicParent.parent;
    config.name = p.name;
    config.fullName = p.name;
    config.email = p.email || "—";

    const words = p.name.split(" ");
    if (words.length > 1) {
      config.initials = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      config.initials = p.name.substring(0, 2).toUpperCase();
    }
  }

  // Override config dengan data kepala sekolah dinamis
  if (role === "principal" && dynamicPrincipal) {
    config.name = dynamicPrincipal.name;
    config.fullName = dynamicPrincipal.name;
    config.nip = dynamicPrincipal.nip || "—";
    config.email = dynamicPrincipal.email || "—";

    const words = dynamicPrincipal.name.split(" ");
    if (words.length > 1) {
      config.initials = (words[0][0] + words[1][0]).toUpperCase();
    } else {
      config.initials = dynamicPrincipal.name.substring(0, 2).toUpperCase();
    }
  }

  const classId =
    typeof router.query.id === "string" ? router.query.id : "10-a";
  let navItems: NavItem[] = customNavItems || [];
  if (!customNavItems) {
    if (role === "teacher") {
      navItems = ROLE_CONFIG.teacher.getNav(classId);
    } else {
      navItems = (ROLE_CONFIG[role] as { defaultNav: NavItem[] }).defaultNav;
    }
  }

  const sidebarProps = {
    role,
    navItems,
    homePath: config.homePath,
    sidebarLabel: config.sidebarLabel,
    currentPath: router.asPath,
    onNavigate: (path: string) => router.push(path),
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 flex">
      {/* ── Desktop Sidebar (fixed, always visible on md+) ────────────────── */}
      {hasSidebar && (
        <div className="hidden md:flex w-64 bg-white border-r border-zinc-200 flex-col fixed h-full z-10 left-0 top-0">
          <SidebarContent {...sidebarProps} />
        </div>
      )}

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────────────── */}
      {hasSidebar && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer panel */}
          <div
            className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white border-r border-zinc-200 flex flex-col z-50 transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          >
            {/* Close button inside drawer */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors z-10"
              aria-label="Tutup menu"
            >
              <X size={20} />
            </button>
            <SidebarContent {...sidebarProps} />
          </div>
        </>
      )}

      {/* ── Main Content ──────────────────────────────────────────────────── */}
      <div
        className={`flex-1 flex flex-col min-h-screen w-full ${hasSidebar ? "md:ml-64" : ""}`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center px-4 md:px-8 justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Hamburger button — mobile only, only when sidebar is enabled */}
            {hasSidebar && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                aria-label="Buka menu"
              >
                <Menu size={22} />
              </button>
            )}

            {/* Logo (shown when no sidebar, i.e. no-sidebar pages) */}
            {!hasSidebar && (
              <span
                className="font-bold text-base md:text-lg text-zinc-900 flex items-center gap-2 cursor-pointer"
                onClick={() => router.push(config.homePath)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="" className="w-8 h-8 md:w-9 md:h-9" />
                <span className="hidden sm:inline">MI INTEGRAL BUAH HATI INSANI</span>
              </span>
            )}

            {/* Header label */}
            <div
              className={`text-zinc-500 text-sm font-medium ${!hasSidebar ? "hidden md:block" : "hidden sm:block"}`}
            >
              {config.headerLabel}
            </div>
          </div>

          {/* User profile */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={profileRef}>
              {/* Avatar / trigger klik */}
              <button
                onClick={() => { setProfileOpen((v) => !v); setShowPwForm(false); setPwError(""); setPwSuccess(""); }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
                aria-label="Profil pengguna"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-zinc-900">{config.name}</div>
                  <div className="text-xs text-zinc-500">{config.subtitle}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {config.initials}
                </div>
              </button>

              {/* Profile Popover — muncul saat diklik */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden">
                  {/* Header profil */}
                  <div className="p-5 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                        {config.initials}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-zinc-900">{config.fullName}</div>
                        <div className="text-xs text-zinc-500">{config.subtitle}</div>
                      </div>
                    </div>
                  </div>

                  {/* Detail info */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">Nama</span>
                      <span className="text-sm text-zinc-900">{config.fullName}</span>
                    </div>
                    {config.nip !== "—" && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">NIP</span>
                        <span className="text-sm text-zinc-900">{config.nip}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">Email</span>
                      <span className="text-sm text-zinc-900 break-all">{config.email}</span>
                    </div>

                    {/* Data anak — khusus parent */}
                    {role === "parent" && dynamicParent?.child && (
                      <div className="pt-3 mt-1 border-t border-zinc-100">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Data Anak</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">Nama</span>
                            <span className="text-sm text-zinc-900 font-medium">{dynamicParent.child.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">NIS</span>
                            <span className="text-sm text-zinc-900">{dynamicParent.child.nis}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">Kelas</span>
                            <span className="text-sm text-zinc-900">{dynamicParent.child.kelas}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    {role === "parent" && dynamicParent?.parent?.noHp && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">No. HP</span>
                        <span className="text-sm text-zinc-900">{dynamicParent.parent.noHp}</span>
                      </div>
                    )}
                  </div>

                  {/* Ganti Password — khusus parent */}
                  {role === "parent" && (
                    <div className="border-t border-zinc-100">
                      <button
                        onClick={() => { setShowPwForm((v) => !v); setPwError(""); setPwSuccess(""); setPwOld(""); setPwNew(""); setPwConfirm(""); }}
                        className="w-full flex items-center justify-between px-5 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                      >
                        <span>🔑 Ganti Password</span>
                        <span className="text-zinc-400 text-xs">{showPwForm ? "▲" : "▼"}</span>
                      </button>

                      {showPwForm && (
                        <form
                          className="px-5 pb-5 space-y-3"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setPwError(""); setPwSuccess("");
                            if (pwNew !== pwConfirm) { setPwError("Konfirmasi password tidak cocok"); return; }
                            if (pwNew.length < 6) { setPwError("Password baru minimal 6 karakter"); return; }
                            setPwLoading(true);
                            try {
                              const res = await fetch("/api/auth/login", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ oldPassword: pwOld, newPassword: pwNew }),
                              });
                              const data = await res.json();
                              if (res.ok && data.success) {
                                setPwSuccess("Password berhasil diubah!");
                                setPwOld(""); setPwNew(""); setPwConfirm("");
                                setTimeout(() => { setShowPwForm(false); setPwSuccess(""); }, 2000);
                              } else {
                                setPwError(data.message || "Gagal mengubah password");
                              }
                            } catch {
                              setPwError("Gagal menghubungi server");
                            } finally {
                              setPwLoading(false);
                            }
                          }}
                        >
                          <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Password Lama</label>
                            <input
                              type="password"
                              autoComplete="current-password"
                              value={pwOld}
                              onChange={(e) => setPwOld(e.target.value)}
                              required
                              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                              placeholder="Masukkan password lama"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Password Baru</label>
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={pwNew}
                              onChange={(e) => setPwNew(e.target.value)}
                              required
                              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                              placeholder="Min. 6 karakter"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-500 mb-1">Konfirmasi Password Baru</label>
                            <input
                              type="password"
                              autoComplete="new-password"
                              value={pwConfirm}
                              onChange={(e) => setPwConfirm(e.target.value)}
                              required
                              className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400"
                              placeholder="Ulangi password baru"
                            />
                          </div>
                          {pwError && <p className="text-xs text-red-500">{pwError}</p>}
                          {pwSuccess && <p className="text-xs text-emerald-600 font-medium">{pwSuccess}</p>}
                          <button
                            type="submit"
                            disabled={pwLoading}
                            className="w-full py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                          >
                            {pwLoading ? "Menyimpan..." : "Simpan Password"}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
