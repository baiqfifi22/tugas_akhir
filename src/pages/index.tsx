"use client";

import { useState } from "react";
import { useRouter } from "next/router";
import { GraduationCap, BookOpen, Shield, UserCog, Users } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focus, setFocus] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy routing by username
    const lower = username.toLowerCase();
    if (lower.includes("admin")) router.push("/admin");
    else if (lower.includes("kepsek") || lower.includes("principal")) router.push("/principal");
    else if (lower.includes("ortu") || lower.includes("parent")) router.push("/parent");
    else router.push("/teacher");
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT - IMAGE */}
      <div className="w-1/2 hidden md:flex items-center justify-center bg-white">
        <img
          src="/login_photo.png"
          alt="login illustration"
          className="w-full"
        />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-gradient-to-br from-orange-100 via-yellow-100 to-green-100 p-10 relative">
        {/* LOGO */}
        <img
          src="/logo.png"
          alt="logo"
          className="absolute top-7 right-10 w-20 md:w-24"
        />

        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-700">
            MI INTEGRAL BUAH HATI INSANI
          </h1>
          <p className="text-gray-500 mt-2">
            Silakan login untuk melakukan absensi digital
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg">
          {/* Username */}
          <div className="mb-5">
            <label className="block text-sm text-gray-600 mb-1">Username</label>
            <input
              type="text"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setFocus("username")}
              onBlur={() => setFocus("")}
              className={`w-full px-4 py-2 rounded-xl border transition-all duration-300 outline-none text-gray-500
                ${
                  focus === "username"
                    ? "border-green-400 shadow-md"
                    : "border-gray-300"
                }`}
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm text-gray-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocus("password")}
              onBlur={() => setFocus("")}
              className={`w-full px-4 py-2 rounded-xl border transition-all duration-300 outline-none text-gray-500
                ${
                  focus === "password"
                    ? "border-orange-400 shadow-md"
                    : "border-gray-300"
                }`}
            />
          </div>

          {/* BUTTON */}
          <button type="submit" className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-300 via-yellow-300 text-gray-700 font-semibold shadow-md hover:scale-105 transition-all duration-300">
            Login
          </button>

          {/* TEXT TAMBAHAN */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Sistem absensi pintar & interaktif ✨
          </p>
        </form>

        {/* Quick Access (Demo) */}
        <div className="mt-8 w-full max-w-sm">
          <p className="text-xs text-gray-400 text-center mb-3">Demo — Akses Cepat Berdasarkan Role:</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push("/teacher")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700 hover:bg-zinc-50 hover:shadow-sm transition-all">
              <BookOpen size={16} className="text-blue-600" /> Guru
            </button>
            <button onClick={() => router.push("/admin")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700 hover:bg-zinc-50 hover:shadow-sm transition-all">
              <UserCog size={16} className="text-emerald-600" /> Admin
            </button>
            <button onClick={() => router.push("/principal")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700 hover:bg-zinc-50 hover:shadow-sm transition-all">
              <Shield size={16} className="text-yellow-600" /> Kepala Sekolah
            </button>
            <button onClick={() => router.push("/parent")} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-700 hover:bg-zinc-50 hover:shadow-sm transition-all">
              <Users size={16} className="text-red-500" /> Orang Tua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
