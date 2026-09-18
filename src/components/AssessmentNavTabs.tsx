import { Link, useLocation } from "@tanstack/react-router";
import { BarChart3, FileCheck2, FileSpreadsheet, FileText } from "lucide-react";

export function AssessmentNavTabs({ id }: { id: string }) {
  const pathname = useLocation({ select: (l) => l.pathname });

  const tabs = [
    {
      to: "/asesmen/$id",
      exact: true,
      label: "Dashboard Diagnosis",
      icon: <BarChart3 className="size-4" />,
    },
    {
      to: "/asesmen/$id/triangulasi",
      exact: false,
      label: "Peta Triangulasi",
      icon: <FileSpreadsheet className="size-4" />,
    },
    {
      to: "/asesmen/$id/kualitatif",
      exact: false,
      label: "Kualitatif & Dokumen",
      icon: <FileCheck2 className="size-4" />,
    },
    {
      to: "/asesmen/$id/laporan",
      exact: false,
      label: "Laporan & Roadmap",
      icon: <FileText className="size-4" />,
    },
  ];

  return (
    <div className="mb-6 flex border-b bg-card px-2 pt-2 rounded-t-2xl overflow-x-auto">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const isActive = tab.exact
            ? pathname === `/asesmen/${id}` || pathname === `/asesmen/${id}/`
            : pathname.startsWith(`/asesmen/${id}/${tab.to.split("/").pop()}`);

          return (
            <Link
              key={tab.to}
              to={tab.to}
              params={{ id }}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "border-primary text-primary bg-primary/5 rounded-t-xl"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-xl"
              }`}
            >
              {tab.icon}
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
