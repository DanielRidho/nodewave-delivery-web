"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Layers3,
  LogOut,
  Menu,
  Pencil,
  Plus,
  ShieldCheck,
  Waves,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MetricCard } from "@/components/metric-card";
import { ProjectDialog } from "@/components/project-dialog";
import { TaskBoard } from "@/components/task-board";
import { api, getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApiEnvelope, Project } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

const roleLabels = {
  PRODUCT_MANAGER: "Product Manager",
  INTERNAL_TEAM: "Internal Team",
  CLIENT_GUEST: "Client Guest",
};
const departmentLabels = {
  PRODUCT: "Product",
  UI_UX: "UI/UX",
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  CLIENT: "Client",
};

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, token, clearSession } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (mounted && (!token || !user)) router.replace("/login");
  }, [mounted, router, token, user]);

  const projects = useQuery({
    queryKey: queryKeys.projects(user?.id ?? "anonymous"),
    queryFn: async () =>
      (
        await api.get<ApiEnvelope<Project[]>>("/projects", {
          params: { page: 1, rows: 100 },
        })
      ).data.data,
    enabled: Boolean(token && user),
  });
  const selected =
    projects.data?.find((project) => project.id === selectedProjectId) ??
    projects.data?.[0];

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      queryClient.clear();
      clearSession();
      router.replace("/login");
    }
  };

  if (!mounted || !user || !token)
    return (
      <div className="fullscreen-loader">
        <span className="brand-mark">
          <Waves />
        </span>
        <p>Opening workspace…</p>
      </div>
    );

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">
            <Waves size={21} />
          </span>{" "}
          nodewave <em>delivery</em>
        </div>
        <nav>
          <a className="active" href="#workspace">
            Workspace
          </a>
          <a href="#board">Board</a>
          <a href="#insights">Insights</a>
        </nav>
        <div className="user-menu">
          <div className="avatar">
            {user.name
              .split(" ")
              .map((word) => word[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div>
            <strong>{user.name}</strong>
            <span>
              {roleLabels[user.role]} · {departmentLabels[user.department]}
            </span>
          </div>
          <ChevronDown size={16} />
          <button
            className="icon-button"
            type="button"
            aria-label="Sign out"
            onClick={logout}
          >
            <LogOut size={18} />
          </button>
        </div>
        <button
          className="mobile-menu"
          type="button"
          aria-label="Open navigation"
        >
          <Menu />
        </button>
      </header>

      <section className="dashboard-content" id="workspace">
        <div className="welcome-row">
          <div>
            <span className="eyebrow">
              <ShieldCheck size={14} />{" "}
              {user.role === "CLIENT_GUEST"
                ? "Client-safe workspace"
                : "Operational workspace"}
            </span>
            <h1>
              {user.role === "CLIENT_GUEST"
                ? `Hello, ${user.name}`
                : "Good morning, team"}
            </h1>
            <p>
              {user.role === "CLIENT_GUEST"
                ? "Here is the latest approved progress for your project."
                : "Here’s the current delivery picture and where attention is needed."}
            </p>
          </div>
          <div className="project-controls">
            {projects.data && projects.data.length > 0 && (
              <label className="project-select">
                <span>Current project</span>
                <select
                  value={selected?.id}
                  onChange={(event) => setSelectedProjectId(event.target.value)}
                >
                  {projects.data.map((project) => (
                    <option value={project.id} key={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {user.role === "PRODUCT_MANAGER" && (
              <div className="project-actions">
                {selected && (
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => {
                      setProjectToEdit(selected);
                      setProjectDialogOpen(true);
                    }}
                  >
                    <Pencil size={15} /> Edit project
                  </button>
                )}
                <button
                  className="button button-primary"
                  type="button"
                  onClick={() => {
                    setProjectToEdit(null);
                    setProjectDialogOpen(true);
                  }}
                >
                  <Plus size={16} /> New project
                </button>
              </div>
            )}
          </div>
        </div>

        {projects.isLoading && (
          <div className="project-loading">Loading project visibility…</div>
        )}
        {projects.isError && (
          <div className="state-box state-error">
            <AlertTriangle />
            <strong>Project data unavailable</strong>
            <span>{getErrorMessage(projects.error)}</span>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => projects.refetch()}
            >
              Try again
            </button>
          </div>
        )}
        {projects.data?.length === 0 && (
          <div className="state-box">
            <Layers3 />
            <strong>No assigned project</strong>
            <span>Ask a Product Manager to add your account to a project.</span>
          </div>
        )}

        {selected && (
          <>
            <section className="project-hero">
              <div>
                <span className="project-kicker">Active project</span>
                <h2>{selected.name}</h2>
                <p>{selected.description}</p>
              </div>
              <div
                className="progress-ring"
                style={
                  {
                    "--progress": `${selected.metrics.completionPercentage * 3.6}deg`,
                  } as React.CSSProperties
                }
              >
                <div>
                  <strong>{selected.metrics.completionPercentage}%</strong>
                  <span>complete</span>
                </div>
              </div>
            </section>

            <section className="metrics-grid" id="insights">
              <MetricCard
                icon={Layers3}
                label="Total deliverables"
                value={selected.metrics.total}
                note="Approved scope"
                tone="blue"
              />
              <MetricCard
                icon={BarChart3}
                label="In progress"
                value={selected.metrics.inProgress}
                note="Active workstreams"
                tone="violet"
              />
              <MetricCard
                icon={CheckCircle2}
                label="Completed"
                value={selected.metrics.done}
                note="Delivered milestones"
                tone="green"
              />
              <MetricCard
                icon={AlertTriangle}
                label="Remaining"
                value={selected.metrics.todo}
                note="Todo and blocked"
                tone="amber"
              />
            </section>

            <div id="board">
              <TaskBoard key={selected.id} project={selected} user={user} />
            </div>
          </>
        )}
      </section>
      {user.role === "PRODUCT_MANAGER" && (
        <ProjectDialog
          userId={user.id}
          project={projectToEdit}
          open={projectDialogOpen}
          onOpenChange={setProjectDialogOpen}
          onSaved={setSelectedProjectId}
        />
      )}
      <footer className="app-footer">
        <span>NodeWave Delivery OS</span>
        <span>Version-safe · Audited · Tenant-isolated</span>
      </footer>
    </main>
  );
}
