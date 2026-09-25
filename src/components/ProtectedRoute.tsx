import { useAuth } from "@/lib/auth";
import type { SystemRole } from "@/lib/questionnaire";
import { Link, useNavigate } from "@tanstack/react-router";
import { Lock, ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles?: SystemRole[];
}) {
  const { user, profile, isLoading, hasRole } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-xs font-semibold text-muted-foreground">Memeriksa hak akses sistem…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="size-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          Akses Terbatas — Memerlukan Login
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Ruang kerja diagnosis dan dashboard organisasi hanya dapat diakses oleh Admin / HR.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Link
            to="/login"
            className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90"
          >
            Masuk ke Akun Admin / HR
          </Link>
          <Link
            to="/"
            className="w-full rounded-xl border bg-card px-4 py-3 text-xs font-semibold hover:bg-muted"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight">
          Hak Akses Tidak Mencukupi
        </h1>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Peran Anda ({profile?.role}) tidak memiliki izin untuk membuka halaman ini.
        </p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <Link
            to="/asesmen"
            className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90"
          >
            Ke Ruang Kerja Asesmen
          </Link>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
