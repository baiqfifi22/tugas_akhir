import React, { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LogOut,
  LayoutDashboard,
  Users,
  UserCog,
  GraduationCap,
  ClipboardCheck,
  BarChart2,
  FileText,
  BookOpen,
  LucideIcon,
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
        label: "Rekap Absensi",
        href: "/admin/attendance",
        icon: ClipboardCheck,
      },
    ],
  },
  teacher: {
    name: "Budi Santoso",
    subtitle: "Guru Tetap",
    initials: "BS",
    fullName: "Budi Santoso, S.Pd",
    nip: "198503152010011023",
    email: "budi.santoso@sekolah.sch.id",
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
      {
        label: "Kirim Laporan",
        href: `/teacher/reports`,
        icon: FileText,
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

export function Layout({
  children,
  role,
  hasSidebar = true,
  customNavItems,
}: LayoutProps) {
  const router = useRouter();
  const config = ROLE_CONFIG[role];
  const classId =
    typeof router.query.id === "string" ? router.query.id : "10-a";
  let navItems: NavItem[] = customNavItems || [];
  if (!customNavItems) {
    if (role === "teacher") {
      navItems = ROLE_CONFIG.teacher.getNav(classId);
    } else {
      // @ts-ignore - We know these roles have defaultNav
      navItems = ROLE_CONFIG[role].defaultNav;
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      {hasSidebar && (
        <div className="w-64 bg-white border-r border-zinc-200 flex flex-col fixed h-full z-10 left-0 top-0">
          <div
            className="h-16 flex items-center px-6 border-b border-zinc-200 shrink-0 cursor-pointer"
            onClick={() => router.push(config.homePath)}
          >
            <span className="font-bold text-lg text-zinc-900 flex items-center gap-2">
              <img src="/logo.png" alt="" className="w-9 h-9" />
              Sistem<span className="text-blue-600">Absen</span>
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="text-xs font-semibold text-zinc-400 mb-4 px-2 uppercase tracking-wide">
              {config.sidebarLabel}
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = router.asPath === item.href;
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
        </div>
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col min-h-screen ${hasSidebar ? "ml-64" : ""}`}
      >
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center px-6 md:px-8 justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {!hasSidebar && (
              <span
                className="font-bold text-lg text-zinc-900 flex items-center gap-2 cursor-pointer"
                onClick={() => router.push(config.homePath)}
              >
                <img src="/logo.png" alt="" className="w-9 h-9" />
                MI INTEGRAL BUAH HATI INSANI
              </span>
            )}
            <div
              className={`text-zinc-500 text-sm font-medium ${!hasSidebar ? "hidden md:block" : "hidden sm:block"}`}
            >
              {config.headerLabel}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-zinc-900">
                    {config.name}
                  </div>
                  <div className="text-xs text-zinc-500">{config.subtitle}</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {config.initials}
                </div>
              </div>

              {/* Profile Hover Popover */}
              <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-zinc-200 p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-zinc-100">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                    {config.initials}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-zinc-900">
                      {config.fullName}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {config.subtitle}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">
                      Nama
                    </span>
                    <span className="text-sm text-zinc-900">
                      {config.fullName}
                    </span>
                  </div>
                  {config.nip !== "—" && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">
                        NIP
                      </span>
                      <span className="text-sm text-zinc-900">
                        {config.nip}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-zinc-400 w-14 shrink-0">
                      Email
                    </span>
                    <span className="text-sm text-zinc-900">
                      {config.email}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}
