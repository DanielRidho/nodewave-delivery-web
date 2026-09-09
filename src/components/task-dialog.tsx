"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, History, Paperclip, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api, getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApiEnvelope, Department, Member, Task } from "@/lib/types";

const schema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter."),
  description: z.string().min(10, "Deskripsi minimal 10 karakter."),
  department: z.enum(["PRODUCT", "UI_UX", "FRONTEND", "BACKEND"]),
  assigneeId: z.string(),
  clientVisible: z.boolean(),
  dueDate: z.string(),
});
type FormData = z.infer<typeof schema>;
type AuditEntry = {
  id: string;
  changedColumn: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string;
  user: { name: string; department: Department };
};

const departmentLabels: Record<Department, string> = {
  PRODUCT: "Product",
  UI_UX: "UI/UX",
  FRONTEND: "Frontend",
  BACKEND: "Backend",
  CLIENT: "Client",
};

export function TaskDialog({
  userId,
  projectId,
  task,
  open,
  onOpenChange,
}: {
  userId: string;
  projectId: string;
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [prerequisiteId, setPrerequisiteId] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      department: "FRONTEND",
      assigneeId: "",
      clientVisible: false,
      dueDate: "",
    },
  });
  useEffect(() => {
    if (!open) return;
    reset(
      task
        ? {
            title: task.title,
            description: task.description,
            department:
              task.department && task.department !== "CLIENT"
                ? task.department
                : "PRODUCT",
            assigneeId: task.assignee?.id ?? "",
            clientVisible: task.clientVisible,
            dueDate: task.dueDate?.slice(0, 10) ?? "",
          }
        : {
            title: "",
            description: "",
            department: "FRONTEND",
            assigneeId: "",
            clientVisible: false,
            dueDate: "",
          },
    );
  }, [open, task, reset]);

  const department = watch("department");
  const members = useQuery({
    queryKey: queryKeys.members(userId, projectId),
    queryFn: async () =>
      (
        await api.get<ApiEnvelope<Member[]>>(`/projects/${projectId}/members`, {
          params: { page: 1, rows: 100 },
        })
      ).data.data,
    enabled: open,
  });
  const projectTasks = useQuery({
    queryKey: queryKeys.dependencyOptions(userId, projectId),
    queryFn: async () =>
      (
        await api.get<ApiEnvelope<Task[]>>(`/projects/${projectId}/tasks`, {
          params: { page: 1, rows: 100 },
        })
      ).data.data,
    enabled: open && Boolean(task),
  });
  const audit = useQuery({
    queryKey: queryKeys.audit(userId, task?.id ?? "new"),
    queryFn: async () =>
      (
        await api.get<ApiEnvelope<AuditEntry[]>>(
          `/tasks/${task?.id}/audit-logs`,
          { params: { page: 1, rows: 20 } },
        )
      ).data.data,
    enabled: open && Boolean(task),
  });

  const save = useMutation({
    mutationFn: async (input: FormData) => {
      const payload = {
        ...input,
        assigneeId: input.assigneeId || null,
        dueDate: input.dueDate
          ? new Date(`${input.dueDate}T17:00:00.000Z`).toISOString()
          : null,
      };
      if (task) {
        return (
          await api.patch(`/tasks/${task.id}`, {
            ...payload,
            expectedVersion: task.version,
          })
        ).data;
      }
      return (await api.post("/tasks", { ...payload, projectId })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectTasks(userId, projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects(userId),
      });
      toast.success(
        task ? "Task berhasil diperbarui." : "Task berhasil dibuat.",
      );
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
      if (
        (error as { response?: { status?: number } }).response?.status === 409
      ) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTasks(userId, projectId),
        });
      }
    },
  });
  const addDependency = useMutation({
    mutationFn: async () => {
      if (!task || !prerequisiteId) return;
      await api.post(`/tasks/${task.id}/dependencies`, {
        prerequisiteTaskId: prerequisiteId,
        expectedVersion: task.version,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projectTasks(userId, projectId),
      });
      setPrerequisiteId("");
      onOpenChange(false);
      toast.success(
        "Prerequisite ditambahkan. Status blocked akan dihitung otomatis.",
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">
                {task ? "Task details" : "New deliverable"}
              </span>
              <Dialog.Title>{task ? "Edit task" : "Create task"}</Dialog.Title>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close">
              <X size={19} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="muted">
            Core fields are managed by Product Managers and protected with
            version checks.
          </Dialog.Description>
          <form
            className="form-stack dialog-form"
            onSubmit={handleSubmit((value) => save.mutate(value))}
          >
            <label>
              Task title
              <input
                {...register("title")}
                placeholder="e.g. Checkout UI design"
              />
            </label>
            {errors.title && (
              <span className="field-error">{errors.title.message}</span>
            )}
            <label>
              Description
              <textarea
                rows={5}
                {...register("description")}
                placeholder="Define the expected outcome and acceptance criteria…"
              />
            </label>
            {errors.description && (
              <span className="field-error">{errors.description.message}</span>
            )}
            <div className="form-row">
              <label>
                Department
                <select {...register("department")}>
                  {(["PRODUCT", "UI_UX", "FRONTEND", "BACKEND"] as const).map(
                    (item) => (
                      <option value={item} key={item}>
                        {departmentLabels[item]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Assignee
                <select {...register("assigneeId")}>
                  <option value="">Unassigned</option>
                  {members.data
                    ?.filter((member) => member.department === department)
                    .map((member) => (
                      <option value={member.id} key={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="form-row">
              <label>
                Due date
                <input type="date" {...register("dueDate")} />
              </label>
              <label className="checkbox-label">
                <input type="checkbox" {...register("clientVisible")} /> Visible
                to client
              </label>
            </div>
            {task?.attachments.length ? (
              <div className="attachment-list">
                <span>
                  <Paperclip size={15} /> Attachments
                </span>
                {task.attachments.map((file) => (
                  <a
                    key={file.id}
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {file.fileName}
                  </a>
                ))}
              </div>
            ) : null}
            {task && (
              <section className="dialog-subsection">
                <div className="subsection-title">
                  <span>
                    <GitBranch size={15} /> Dependencies
                  </span>
                  <small>{task.dependencies.length} prerequisite</small>
                </div>
                {task.dependencies.map((dependency) => (
                  <div className="dependency-row" key={dependency.id}>
                    <span>{dependency.title}</span>
                    <b>{dependency.status.replace("_", " ")}</b>
                  </div>
                ))}
                <div className="dependency-add">
                  <select
                    value={prerequisiteId}
                    onChange={(event) => setPrerequisiteId(event.target.value)}
                  >
                    <option value="">Select prerequisite…</option>
                    {projectTasks.data
                      ?.filter(
                        (candidate) =>
                          candidate.id !== task.id &&
                          !task.dependencies.some(
                            (item) => item.taskId === candidate.id,
                          ),
                      )
                      .map((candidate) => (
                        <option value={candidate.id} key={candidate.id}>
                          {candidate.title}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="button button-ghost"
                    disabled={!prerequisiteId || addDependency.isPending}
                    onClick={() => addDependency.mutate()}
                  >
                    Add
                  </button>
                </div>
              </section>
            )}
            {task && (
              <section className="dialog-subsection audit-preview">
                <div className="subsection-title">
                  <span>
                    <History size={15} /> Immutable audit trail
                  </span>
                  <small>{audit.data?.length ?? 0} changes</small>
                </div>
                {audit.isLoading && <p>Loading history…</p>}
                {audit.data?.slice(0, 4).map((entry) => (
                  <div className="audit-row" key={entry.id}>
                    <span>
                      <b>{entry.user.name}</b> changed {entry.changedColumn}
                    </span>
                    <time>
                      {new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(entry.createdAt))}
                    </time>
                  </div>
                ))}
              </section>
            )}
            <div className="dialog-actions">
              <Dialog.Close className="button button-ghost" type="button">
                Cancel
              </Dialog.Close>
              <button
                className="button button-primary"
                disabled={save.isPending}
                type="submit"
              >
                {save.isPending ? (
                  "Saving…"
                ) : task ? (
                  "Save changes"
                ) : (
                  <>
                    <Plus size={16} /> Create task
                  </>
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
