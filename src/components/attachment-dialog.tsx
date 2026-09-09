"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link2, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api, getErrorMessage } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { Task } from "@/lib/types";

const schema = z.object({
  fileName: z.string().trim().min(1, "Nama attachment wajib diisi."),
  fileUrl: z.url(
    "Masukkan URL Figma, Drive, preview, atau artifact yang valid.",
  ),
});
type FormData = z.infer<typeof schema>;

export function AttachmentDialog({
  userId,
  task,
  open,
  onOpenChange,
}: {
  userId: string;
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fileName: "", fileUrl: "" },
  });
  useEffect(() => {
    if (!open || !task) return;
    reset();
  }, [open, reset, task]);
  const save = useMutation({
    mutationFn: async (input: FormData) => {
      if (!task) return;
      await api.post(`/tasks/${task.id}/attachments`, input);
    },
    onSuccess: () => {
      if (task)
        queryClient.invalidateQueries({
          queryKey: queryKeys.projectTasks(userId, task.projectId),
        });
      reset();
      onOpenChange(false);
      toast.success("Work attachment ditambahkan.");
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
                <Link2 size={13} /> Work artifact
              </span>
              <Dialog.Title>Add attachment</Dialog.Title>
            </div>
            <Dialog.Close className="icon-button" aria-label="Close">
              <X size={19} />
            </Dialog.Close>
          </div>
          <Dialog.Description className="muted">
            Attach a Figma, Drive, preview, API documentation, or deployed
            artifact URL to “{task?.title}”.
          </Dialog.Description>
          <form
            className="form-stack dialog-form"
            onSubmit={handleSubmit((value) => save.mutate(value))}
          >
            <label>
              Display name
              <input
                {...register("fileName")}
                placeholder="Checkout prototype"
              />
            </label>
            {errors.fileName && (
              <span className="field-error">{errors.fileName.message}</span>
            )}
            <label>
              Artifact URL
              <input {...register("fileUrl")} placeholder="https://…" />
            </label>
            {errors.fileUrl && (
              <span className="field-error">{errors.fileUrl.message}</span>
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
                {save.isPending ? "Adding…" : "Add attachment"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
