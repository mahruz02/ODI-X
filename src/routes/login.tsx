import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Activity, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login Admin & HR — ODI-X" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { signInWithPassword, user, profile } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user)
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <ShieldCheck className="size-14 text-primary" />
        <h1 className="mt-4 text-2xl font-extrabold">Anda Sudah Login</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {profile?.name || user.email} ({profile?.role})
        </p>
        <button
          type="button"
          onClick={() => void navigate({ to: "/asesmen" })}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground"
        >
          Masuk ke Ruang Kerja
        </button>
      </main>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await signInWithPassword(email, password);
    setLoading(false);
    if (result.error) setError(result.error.message || "Gagal login.");
    else void navigate({ to: "/asesmen" });
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Activity className="size-6" />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold">Ruang Kerja Admin & HR ODI-X</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Masuk menggunakan akun yang dibuat Admin
          </p>
        </div>
        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-xs font-semibold">
            Alamat Email
            <div className="relative mt-1">
              <Mail className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-xs"
                required
              />
            </div>
          </label>
          <label className="block text-xs font-semibold">
            Password
            <div className="relative mt-1">
              <KeyRound className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-xs"
                required
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            {loading ? "Memproses Login…" : "Masuk ke Sistem"}
          </button>
        </form>
      </div>
    </main>
  );
}
