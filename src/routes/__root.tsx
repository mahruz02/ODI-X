import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Activity, ShieldCheck, UserCheck, LogOut } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "../lib/auth";
import { SYSTEM_ROLE_LABELS } from "../lib/questionnaire";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Halaman Tidak Ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Gagal Memuat Halaman
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Terjadi masalah sistem. Silakan coba muat ulang halaman.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Coba Lagi
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}

function SiteHeader() {
  const { user, profile, signOut } = useAuth();

  return (
    <header className="no-print sticky top-0 z-40 border-b bg-card/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Activity className="size-5" />
            </span>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-tight leading-none">
                ODI-X <span className="text-xs font-semibold text-primary font-sans">v2.0</span>
              </span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide">
                Organizational Health & Diagnosis System
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm font-semibold">
            <Link
              to="/"
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted"
            >
              Beranda
            </Link>
            <Link
              to="/asesmen"
              activeProps={{ className: "bg-accent text-accent-foreground" }}
              className="rounded-lg px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted"
            >
              Proyek Asesmen
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-bold text-foreground leading-tight">
                  {profile?.name || user.email}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-primary">
                  <ShieldCheck className="size-3" />
                  {SYSTEM_ROLE_LABELS[profile?.role || "hr"]}
                </span>
              </div>
              <button
                type="button"
                onClick={() => void signOut()}
                className="inline-flex items-center gap-1.5 rounded-xl border bg-background px-3 py-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <LogOut className="size-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border bg-accent/40 px-3 py-1 text-accent-foreground text-[11px]">
                <UserCheck className="size-3.5" /> Akses Publik
              </span>
              <Link
                to="/login"
                className="rounded-xl bg-primary px-4 py-2 text-primary-foreground transition-opacity hover:opacity-90 shadow-sm"
              >
                Masuk Admin / HR
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ODI-X — Sistem Diagnosis Kesehatan Organisasi 12 Domain" },
      {
        name: "description",
        content:
          "Sistem diagnosis kesehatan organisasi 12 domain komprehensif: triangulasi persepsi 4 level, skoring kuantitatif, analisis kesenjangan, dan roadmap rekomendasi.",
      },
      { property: "og:title", content: "ODI-X — Diagnosis Kesehatan Organisasi" },
      {
        property: "og:description",
        content:
          "Triangulasi persepsi 4 level (Leadership, Manager, Employee, Stakeholder) dalam 12 domain kesehatan organisasi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRespondentView = pathname.startsWith("/isi");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {!isRespondentView && <SiteHeader />}
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
      </AuthProvider>
    </QueryClientProvider>
  );
}
