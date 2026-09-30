import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
export const Route = createFileRoute("/profile")({ component: ProfilePage });
function ProfilePage() {
  const { user, profile } = useAuth();
  return (
    <ProtectedRoute allowedRoles={["admin", "hr"]}>
      <main className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-extrabold">Profil</h1>
        <div className="mt-6 space-y-3 rounded-2xl border bg-card p-6 text-sm">
          <p>
            <b>Nama:</b> {profile?.name}
          </p>
          <p>
            <b>Email:</b> {user?.email}
          </p>
          <p>
            <b>Peran:</b> {profile?.role}
          </p>
        </div>
      </main>
    </ProtectedRoute>
  );
}
