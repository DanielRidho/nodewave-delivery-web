"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Inbox,
  LoaderCircle,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type {
  ApiEnvelope,
  Department,
  PaginationMeta,
  Project,
  Task,
  TaskStatus,
  User,
} from "@/lib/types";
import { AttachmentDialog } from "./attachment-dialog";
import { StatusPill } from "./status-pill";
import { TaskCard } from "./task-card";
import { TaskDialog } from "./task-dialog";

const columns: Array<{ status: TaskStatus; description: string }> = [
  { status: "TODO", description: "Ready to be picked up" },
  { status: "BLOCKED", description: "Waiting on prerequisites" },
  { status: "IN_PROGRESS", description: "Currently being worked" },
  { status: "DONE", description: "Completed deliverables" },
];

export function TaskBoard({ project, user }: { project: Project; user: User }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<Department | "">("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [attachmentTask, setAttachmentTask] = useState<Task | null>(null);
  const clientView = user.role === "CLIENT_GUEST";
  const tasks = useQuery({
    queryKey: queryKeys.tasks(user.id, project.id, {
      search,
      department,
      page,
    }),
    queryFn: async () => {
      const { data } = await api.get<
        ApiEnvelope<Task[], { pagination: PaginationMeta }>
      >(`/projects/${project.id}/tasks`, {
        params: {
          page,
          rows: 20,
          filters:
            !clientView && department
              ? JSON.stringify({ department })
              : undefined,
          searchFilters: search
            ? JSON.stringify({ title: search, description: search })
            : undefined,
        },
      });
      return { items: data.data, pagination: data.meta?.pagination };
    },
  });
  const taskItems = tasks.data?.items;

  const move = useMutation({
    mutationFn: async ({
      task,
      status,
    }: {
      task: Task;
      status: "TODO" | "IN_PROGRESS" | "DONE";
    }) =>
      (
        await api.patch(`/tasks/${task.id}/status`, {
          status,
          expectedVersion: task.version,
        })
      ).data,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectTasks(user.id, project.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects(user.id),
      });
      toast.success("Status task diperbarui.");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectTasks(user.id, project.id),
      });
    },
  });

  const openTask = (task: Task) => {
    if (task.permissions?.canEditCore) {
      setSelectedTask(task);
      setDialogOpen(true);
    }
  };

  return (
    <section className="board-section">
      <div className="board-toolbar">
        <div>
          <h2>{clientView ? "Visible milestones" : "Delivery board"}</h2>
          <p>
            {clientView
              ? "The latest client-facing delivery progress."
              : "Live status with dependency-aware controls."}
          </p>
        </div>
        <div className="toolbar-actions">
          <label className="search-box">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search tasks…"
            />
          </label>
          {!clientView && (
            <label className="filter-box">
              <SlidersHorizontal size={16} />
              <select
                aria-label="Filter department"
                value={department}
                onChange={(event) => {
                  setDepartment(event.target.value as Department | "");
                  setPage(1);
                }}
              >
                <option value="">All departments</option>
                <option value="PRODUCT">Product</option>
                <option value="UI_UX">UI/UX</option>
                <option value="FRONTEND">Frontend</option>
                <option value="BACKEND">Backend</option>
              </select>
            </label>
          )}
          {user.role === "PRODUCT_MANAGER" && (
            <button
              className="button button-primary"
              type="button"
              onClick={() => {
                setSelectedTask(null);
                setDialogOpen(true);
              }}
            >
              <Plus size={17} /> New task
            </button>
          )}
        </div>
      </div>

      {tasks.isLoading && (
        <div className="state-box">
          <LoaderCircle className="spin" />
          <strong>Loading delivery board…</strong>
          <span>Fetching the latest task versions.</span>
        </div>
      )}
      {tasks.isError && (
        <div className="state-box state-error">
          <AlertCircle />
          <strong>Could not load tasks</strong>
          <span>{getErrorMessage(tasks.error)}</span>
          <button
            className="button button-ghost"
            type="button"
            onClick={() => tasks.refetch()}
          >
            Try again
          </button>
        </div>
      )}
      {taskItems?.length === 0 && (
        <div className="state-box">
          <Inbox />
          <strong>No tasks found</strong>
          <span>Try another search or add the first task.</span>
        </div>
      )}

      {taskItems && taskItems.length > 0 && (
        <div className={`board-grid ${clientView ? "board-client" : ""}`}>
          {columns.map((column) => {
            const items = taskItems.filter(
              (task) => task.effectiveStatus === column.status,
            );
            return (
              <section className="board-column" key={column.status}>
                <div className="column-head">
                  <div>
                    <StatusPill status={column.status} />
                    <span>{items.length}</span>
                  </div>
                  <p>{column.description}</p>
                </div>
                <div className="column-tasks">
                  {items.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      clientView={clientView}
                      busy={move.isPending}
                      onMove={(item, status) =>
                        move.mutate({ task: item, status })
                      }
                      onEdit={openTask}
                      onAttach={setAttachmentTask}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="column-empty">Nothing here</div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {tasks.data?.pagination && tasks.data.pagination.totalPages > 1 && (
        <nav className="board-pagination" aria-label="Task pagination">
          <button
            type="button"
            className="button button-ghost"
            disabled={page <= 1 || tasks.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </button>
          <span>
            Page {tasks.data.pagination.page} of{" "}
            {tasks.data.pagination.totalPages}
          </span>
          <button
            type="button"
            className="button button-ghost"
            disabled={
              page >= tasks.data.pagination.totalPages || tasks.isFetching
            }
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </nav>
      )}

      {user.role === "PRODUCT_MANAGER" && (
        <TaskDialog
          userId={user.id}
          projectId={project.id}
          task={selectedTask}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
      <AttachmentDialog
        userId={user.id}
        task={attachmentTask}
        open={Boolean(attachmentTask)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setAttachmentTask(null);
        }}
      />
    </section>
  );
}
