import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, KeyRound, Mail, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import type { SystemRole } from "@/lib/questionnaire";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login Admin & HR — ODI-X" },
      {
        name: "description",
        content: "Halaman masuk sistem diagnosis ODI-X untuk Admin dan HR.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signInWithPassword, signInWithOtp, signUp, user, profile } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"password" | "otp" | "signup">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<SystemRole>("hr");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (user) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-8" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          Anda Sudah Login
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Terautentikasi sebagai <strong>{profile?.name || user.email}</strong> ({profile?.role})
        </p>
        <button
          type="button"
          onClick={() => void navigate({ to: "/asesmen" })}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90"
        >
          Masuk ke Ruang Kerja Proyek
        </button>
      </main>
    );
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await signInWithPassword(email, password);
    setLoading(false);
    if (error) {
      setError(error.message || "Gagal login. Periksa kembali email & password Anda.");
    } else {
      void navigate({ to: "/asesmen" });
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await signInWithOtp(email);
    setLoading(false);
    if (error) {
      setError(error.message || "Gagal mengirim link login.");
    } else {
      setMessage("Link login magic link telah dikirim ke email Anda.");
    }
  }

  async function handleSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await signUp(email, password, name.trim(), role);
    setLoading(false);
    if (error) {
      setError(error.message || "Gagal pendaftaran akun.");
    } else {
      setMessage("Pendaftaran berhasil. Silakan periksa email Anda atau langsung login.");
      setMode("password");
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Activity className="size-6" />
          </span>
          <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight">
            Ruang Kerja Admin & HR ODI-X
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">Akses khusus Admin dan HR</p>
        </div>

        {/* Mode Selector */}
        <div className="mb-6 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`rounded-lg py-2 transition-all ${
              mode === "password"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground"
            }`}
          >
            Password
          </button>
          <button
            type="button"
            onClick={() => setMode("otp")}
            className={`rounded-lg py-2 transition-all ${
              mode === "otp"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground"
            }`}
          >
            Magic Link
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg py-2 transition-all ${
              mode === "signup"
                ? "bg-card text-foreground shadow-sm font-bold"
                : "text-muted-foreground"
            }`}
          >
            Daftar Akun
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-600">
            {message}
          </div>
        )}

        {mode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground">Alamat Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bmt.id"
                  className="w-full rounded-xl border bg-background pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Password</label>
              <div className="relative mt-1">
                <KeyRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border bg-background pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Memproses Login…" : "Masuk ke Sistem"}
            </button>
          </form>
        )}

        {mode === "otp" && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground">Alamat Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bmt.id"
                  className="w-full rounded-xl border bg-background pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Tautan masuk tanpa password akan dikirimkan langsung ke kotak masuk email Anda.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Sending Magic Link…" : "Kirim Magic Link"}
            </button>
          </form>
        )}

        {mode === "signup" && (
          <form onSubmit={handleSignUpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground">Nama Lengkap</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ahmad Asesor"
                className="mt-1 w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Alamat Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bmt.id"
                className="mt-1 w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="mt-1 w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground">
                Peran / Scope Akses
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as SystemRole)}
                className="mt-1 w-full rounded-xl border bg-background px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="hr">HR</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Mendaftarkan Akun…" : "Daftar Akun Baru"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
