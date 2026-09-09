"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Pencil, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api, getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { ApiEnvelope, Project } from "@/lib/types";

const schema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter.").max(120),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi minimal 10 karakter.")
    .max(2000),
  accessCode: z
    .string()
    .trim()
    .min(4, "Access code minimal 4 karakter.")
    .max(40)
    .regex(/^[A-Za-z0-9-]+$/, "Gunakan huruf, angka, dan tanda hubung saja."),
});

type FormData = z.infer<typeof schema>;

export function ProjectDialog({
  userId,
  project,
  open,
  onOpenChange,
  onSaved,
}: {
  userId: string;
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (projectId: string) => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", accessCode: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      project
        ? {
            name: project.name,
            description: project.description,
            accessCode: project.accessCode ?? "",
          }
        : { name: "", description: "", accessCode: "" },
    );
  }, [open, project, reset]);

  const save = useMutation({
    mutationFn: async (input: FormData) => {
      const response = project
        ? await api.patch<ApiEnvelope<{ id: string }>>(
            `/projects/${project.id}`,
            input,
          )
        : await api.post<ApiEnvelope<{ id: string }>>("/projects", input);
      return response.data.data;
    },
    onSuccess: async (savedProject) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.projects(userId),
      });
      onSaved(savedProject.id);
      onOpenChange(false);
      toast.success(
        project ? "Project berhasil diperbarui." : "Project berhasil dibuat.",
      );
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content dialog-small">
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">
                {project ? <Pencil size={13} /> : <FolderPlus size={13} />}
                Project workspace
              </span>
              <Dialog.Title>
                {project ? "Edit project" : "Create project"}
              </Dialog.Title>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close">
              <X size={19} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="muted">
            Product Managers control the project identity and client access
            code.
          </Dialog.Description>
          <form
            className="form-stack dialog-form"
            onSubmit={handleSubmit((value) => save.mutate(value))}
          >
            <label>
              Project name
              <input
                {...register("name")}
                placeholder="e.g. Commerce platform revamp"
              />
            </label>
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
            <label>
              Description
              <textarea
                rows={5}
                {...register("description")}
                placeholder="Describe the project outcome and scope…"
              />
            </label>
            {errors.description && (
              <span className="field-error">{errors.description.message}</span>
            )}
            <label>
              Client access code
              <input
                {...register("accessCode")}
                autoComplete="off"
                placeholder="CLIENT-PROJECT-2026"
              />
            </label>
            {errors.accessCode && (
              <span className="field-error">{errors.accessCode.message}</span>
            )}
            <p className="form-help">
              Share this code only with the client assigned to this project.
            </p>
            <div className="dialog-actions">
              <Dialog.Close className="button button-ghost" type="button">
                Cancel
              </Dialog.Close>
              <button
                className="button button-primary"
                disabled={save.isPending}
                type="submit"
              >
                {save.isPending
                  ? "Saving…"
                  : project
                    ? "Save project"
                    : "Create project"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
