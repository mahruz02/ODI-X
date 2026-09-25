import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ROLE_LABELS, type Role } from "@/lib/questionnaire";
import type { RespondentLink, RespondentRow } from "@/lib/diagnosis.server";
import {
  addRespondentLink,
  getRespondents,
  listRespondentLinks,
  removeRespondent,
  removeResponsesByRole,
} from "@/lib/admin.functions";

export const ROLES: Role[] = ["pengurus", "manajemen", "karyawan", "stakeholder"];

export function IndexCard({
  title,
  value,
  badge,
  desc,
}: {
  title: string;
  value: string;
  badge: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground">{title}</span>
        <span className="rounded-full border bg-accent/30 px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
          {badge}
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-extrabold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}

export function RespondentLinkManager({ id }: { id: string }) {
  const qc = useQueryClient();
  const [role, setRole] = useState<Role>("karyawan");
  const [name, setName] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const { data: rawLinks = [] } = useQuery({
    queryKey: ["respondent-links", id],
    queryFn: () => listRespondentLinks({ data: { id } }),
  });
  const links = rawLinks as RespondentLink[];
  const create = useMutation({
    mutationFn: () =>
      addRespondentLink({
        data: { organizationId: id, perspective: role, respondentName: name.trim() || undefined },
      }),
    onSuccess: () => {
      setName("");
      void qc.invalidateQueries({ queryKey: ["respondent-links", id] });
    },
  });
  const urlOf = (token: string) =>
    typeof window !== "undefined" ? `${window.location.origin}/isi/${token}` : `/isi/${token}`;
  return (
    <section className="mb-6 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight">Link Khusus Responden</h2>
          <p className="text-xs text-muted-foreground">
            Asesor/responden isi nama dan kuesioner tanpa login lewat link unik.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="rounded-xl border bg-background px-3 py-2 text-xs font-semibold"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama/inisial opsional"
            className="rounded-xl border bg-background px-3 py-2 text-xs"
          />
          <button
            type="button"
            disabled={create.isPending}
            onClick={() => create.mutate()}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            Buat Link Khusus
          </button>
        </div>
      </div>
      {links.length > 0 && (
        <div className="mt-4 space-y-2">
          {links.slice(0, 6).map((link) => {
            const url = urlOf(link.token);
            return (
              <div
                key={link.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3 text-xs"
              >
                <span className="font-semibold">
                  {ROLE_LABELS[link.perspective]} · {link.respondent_name || "Tanpa nama"} ·{" "}
                  {link.status}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(url);
                    setCopied(link.id);
                    setTimeout(() => setCopied(null), 2000);
                  }}
                  className="rounded-lg border px-3 py-1.5 font-bold hover:bg-muted"
                >
                  {copied === link.id ? "Tersalin" : "Salin Link"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function ResponseManager({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data: rawRespondents = [], isLoading } = useQuery({
    queryKey: ["respondents", id],
    queryFn: () => getRespondents({ data: { id } }),
  });
  const respondents = rawRespondents as RespondentRow[];
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["respondents", id] });
    void qc.invalidateQueries({ queryKey: ["dashboard", id] });
    void qc.invalidateQueries({ queryKey: ["triangulasi", id] });
    void qc.invalidateQueries({ queryKey: ["projects"] });
  };
  const delOne = useMutation({
    mutationFn: (respondentId: string) =>
      removeRespondent({ data: { organizationId: id, respondentId } }),
    onSuccess: invalidate,
  });
  const delRole = useMutation({
    mutationFn: (role: Role) => removeResponsesByRole({ data: { organizationId: id, role } }),
    onSuccess: invalidate,
  });
  return (
    <section className="mb-10 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="mb-1 font-display text-xl font-bold tracking-tight">
        Manajemen Data Responden
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Kelola dan bersihkan data sampel kuesioner per responden atau per prespektif.
      </p>
      <div className="mb-4 flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <button
            key={role}
            type="button"
            disabled={delRole.isPending}
            onClick={() => {
              if (
                window.prompt(
                  `Ketik RESET untuk menghapus semua isian ${ROLE_LABELS[role]} pada asesmen ini.`,
                ) === "RESET"
              )
                delRole.mutate(role);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-background px-3 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="size-3.5" />
            Reset {ROLE_LABELS[role]}
          </button>
        ))}
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat data responden…</p>
      ) : respondents.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
          Belum ada data kuesioner yang masuk.
        </p>
      ) : (
        <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
          {respondents.map((r) => (
            <div
              key={r.respondent_id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3 text-xs"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {r.name?.trim() ? r.name : "Anonim"}{" "}
                  <span className="font-normal text-muted-foreground">
                    · {ROLE_LABELS[r.role as Role] ?? r.role}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {r.answers} jawaban{r.tenure ? ` · masa kerja ${r.tenure}` : ""} ·{" "}
                  {new Date(r.submitted_at).toLocaleDateString("id-ID")}
                </p>
              </div>
              <button
                type="button"
                disabled={delOne.isPending}
                onClick={() => {
                  if (
                    window.prompt("Ketik HAPUS untuk menghapus seluruh isian responden ini.") ===
                    "HAPUS"
                  )
                    delOne.mutate(r.respondent_id);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 px-2.5 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="size-3.5" />
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
