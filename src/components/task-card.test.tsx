import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Task } from "@/lib/types";
import { TaskCard } from "./task-card";

const blockedTask: Task = {
  id: "task-1",
  projectId: "project-1",
  title: "Frontend checkout slicing",
  description: "Implement the approved checkout design.",
  status: "TODO",
  effectiveStatus: "BLOCKED",
  clientVisible: true,
  dueDate: null,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  department: "FRONTEND",
  assignee: null,
  dependencies: [
    {
      id: "dep-1",
      taskId: "api-1",
      title: "Checkout API",
      status: "IN_PROGRESS",
    },
  ],
  blockedBy: [{ id: "api-1", title: "Checkout API" }],
  attachments: [],
  permissions: {
    canEditCore: false,
    canDelete: false,
    canAddDependency: false,
    canAttach: false,
    canStartWhenReady: true,
    canStart: false,
    canComplete: false,
    blockedReason: "1 prerequisite belum selesai",
  },
};

describe("TaskCard", () => {
  it("shows the backend-provided blocker and disables the start action", () => {
    const onMove = vi.fn();
    render(<TaskCard task={blockedTask} onMove={onMove} />);
    expect(screen.getByText(/Waiting for Checkout API/)).toBeInTheDocument();
    const startButton = screen.getByRole("button", { name: /Start work/ });
    expect(startButton).toBeDisabled();
    fireEvent.click(startButton);
    expect(onMove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: blockedTask.title }));
    expect(onMove).not.toHaveBeenCalled();
  });

  it("does not render internal identity in client mode", () => {
    render(
      <TaskCard
        task={{
          ...blockedTask,
          assignee: {
            id: "u1",
            name: "Internal Name",
            email: "i@test",
            department: "FRONTEND",
            avatarUrl: null,
          },
        }}
        clientView
      />,
    );
    expect(screen.queryByText("Internal Name")).not.toBeInTheDocument();
  });
});
