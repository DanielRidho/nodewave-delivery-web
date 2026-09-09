import {
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Eye,
  Link2,
  LockKeyhole,
  Paperclip,
  Pencil,
} from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";
import { StatusPill } from "./status-pill";

const departments: Record<string, string> = {
  PRODUCT: "Product",
  UI_UX: "UI/UX",
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  CLIENT: "Client",
};

export function TaskCard({
  task,
  clientView = false,
  busy = false,
  onMove,
  onEdit,
  onAttach,
}: {
  task: Task;
  clientView?: boolean;
  busy?: boolean;
  onMove?: (task: Task, status: Exclude<TaskStatus, "BLOCKED">) => void;
  onEdit?: (task: Task) => void;
  onAttach?: (task: Task) => void;
}) {
  const date = task.dueDate
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
      }).format(new Date(task.dueDate))
    : null;
  const canEditCore = task.permissions?.canEditCore ?? false;

  return (
    <article
      className={`task-card ${task.effectiveStatus === "BLOCKED" ? "task-blocked" : ""}`}
    >
      <div className="task-card-top">
        {clientView ? (
          <StatusPill status={task.effectiveStatus} />
        ) : (
          <span className="dept-tag">{departments[task.department ?? ""]}</span>
        )}
        {!clientView && task.clientVisible && (
          <span className="visible-tag">
            <Eye size={12} /> Client
          </span>
        )}
      </div>
      <button
        type="button"
        className={`task-title ${canEditCore ? "task-title-editable" : ""}`}
        disabled={!canEditCore}
        onClick={() => onEdit?.(task)}
      >
        <span>{task.title}</span>
        {canEditCore && <Pencil size={12} aria-hidden="true" />}
      </button>
      <p className="task-description">{task.description}</p>

      {!clientView && task.blockedBy.length > 0 && (
        <div className="blocked-callout">
          <LockKeyhole size={15} />
          <span>
            Waiting for{" "}
            {task.blockedBy.map((dependency) => dependency.title).join(", ")}
          </span>
        </div>
      )}

      {!clientView &&
        task.dependencies.length > 0 &&
        task.blockedBy.length === 0 && (
          <div className="dependency-done">
            <Link2 size={14} /> {task.dependencies.length} dependencies cleared
          </div>
        )}

      <div className="task-meta">
        {!clientView && (
          <span>
            <CircleUserRound size={15} /> {task.assignee?.name ?? "Unassigned"}
          </span>
        )}
        {date && (
          <span>
            <CalendarDays size={15} /> {date}
          </span>
        )}
        {task.attachments.length > 0 && (
          <span>
            <Paperclip size={15} /> {task.attachments.length}
          </span>
        )}
      </div>

      {!clientView && task.permissions?.canAttach && (
        <button
          type="button"
          className="attachment-action"
          onClick={() => onAttach?.(task)}
        >
          <Paperclip size={13} /> Add work attachment
        </button>
      )}

      {!clientView &&
        (task.permissions?.canStart || task.permissions?.canComplete) && (
          <button
            type="button"
            className="task-action"
            disabled={busy}
            onClick={() =>
              onMove?.(task, task.status === "TODO" ? "IN_PROGRESS" : "DONE")
            }
          >
            {task.status === "TODO" ? "Start work" : "Mark complete"}
            <ChevronRight size={15} />
          </button>
        )}
      {!clientView &&
        task.permissions?.canStartWhenReady &&
        !task.permissions.canStart && (
          <button
            type="button"
            className="task-action task-action-locked"
            disabled
            title={task.permissions.blockedReason ?? undefined}
          >
            Start work
            <LockKeyhole size={14} />
          </button>
        )}
    </article>
  );
}
