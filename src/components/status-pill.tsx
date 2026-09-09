import type { TaskStatus } from "@/lib/types";

const label: Record<TaskStatus, string> = {
  TODO: "To do",
  BLOCKED: "Blocked",
  IN_PROGRESS: "In progress",
  DONE: "Done",
};

export function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span className={`status-pill status-${status.toLowerCase()}`}>
      {label[status]}
    </span>
  );
}
