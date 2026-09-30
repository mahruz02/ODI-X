import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createManagedUser } from "@/lib/admin.functions";
export const Route = createFileRoute("/users")({ component: UsersPage });
function UsersPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "hr">("hr");
  const [message, setMessage] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await createManagedUser({ data: { email, name, password, role } });
    setMessage(r.ok ? "Akun berhasil dibuat" : "Gagal membuat akun");
    if (r.ok) {
      setEmail("");
      setName("");
      setPassword("");
    }
  }
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <main className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-extrabold">Manajemen User</h1>
        <p className="mt-2 text-sm text-muted-foreground">Hanya Admin dapat membuat akun baru.</p>
        <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border bg-card p-6">
          <input
            className="w-full rounded-xl border p-3 text-sm"
            placeholder="Nama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border p-3 text-sm"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border p-3 text-sm"
            type="password"
            placeholder="Password minimal 8 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
          <select
            className="w-full rounded-xl border p-3 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as "admin" | "hr")}
          >
            <option value="hr">HR</option>
            <option value="admin">Admin</option>
          </select>
          <button className="w-full rounded-xl bg-primary p-3 text-sm font-bold text-primary-foreground">
            Buat Akun
          </button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </form>
      </main>
    </ProtectedRoute>
  );
}
