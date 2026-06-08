import { useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [focus, setFocus] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Redirect directly, session is now handled by HttpOnly cookies
        router.push(data.redirect);
      } else {
        setError(
          data.message ||
            "Gagal login. Periksa kembali username & password Anda.",
        );
      }
    } catch (err) {
      setError("Terjadi kesalahan pada server. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="w-1/2 hidden md:flex items-center justify-center bg-white">
        <Image
          src="/login_photo.png"
          alt="login illustration"
          className="w-full"
          priority
        />
      </div>

      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-gradient-to-br from-orange-100 via-yellow-100 to-green-100 p-10 relative">
        {/* LOGO */}
        <Image
          src="/logo.png"
          alt="logo"
          className="absolute top-7 right-10 w-20 md:w-24"
          priority
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
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-lg"
        >
          {/* Username */}
          <div className="mb-5">
            <label
              htmlFor="username"
              className="block text-sm text-gray-600 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
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
            <label
              htmlFor="password"
              className="block text-sm text-gray-600 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
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

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-600 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-xl bg-gradient-to-r from-orange-300 via-yellow-300 text-gray-700 font-semibold shadow-md transition-all duration-300 ${loading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}`}
          >
            {loading ? "Memproses..." : "Login"}
          </button>

          {/* TEXT TAMBAHAN */}
          <p className="text-xs text-gray-400 text-center mt-4">
            Sistem absensi pintar & interaktif ✨
          </p>
        </form>
      </div>
    </div>
  );
}
