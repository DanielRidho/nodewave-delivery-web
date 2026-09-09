"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api, getErrorMessage } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter."),
  email: z.email("Masukkan email yang valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  projectAccessCode: z
    .string()
    .trim()
    .min(4, "Access code minimal 4 karakter."),
});
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const createAccount = useMutation({
    mutationFn: (input: FormData) => api.post("/auth/register", input),
    onSuccess: () => {
      toast.success("Account berhasil dibuat. Silakan sign in.");
      router.push("/login");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <main className="login-shell register-shell">
      <section className="login-story register-story">
        <div className="brand brand-light">
          <span className="brand-mark">
            <Waves size={21} />
          </span>{" "}
          nodewave
        </div>
        <div className="story-copy">
          <span className="eyebrow eyebrow-light">
            <ShieldCheck size={14} /> Tenant-isolated access
          </span>
          <h1>A clear window into your project’s progress.</h1>
          <p>
            Client accounts only receive approved milestones and aggregate
            delivery metrics. Internal people, comments, and work history stay
            private.
          </p>
        </div>
        <p className="story-foot">Access is scoped to one project tenant.</p>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <Link className="back-link" href="/login">
            <ArrowLeft size={15} /> Back to sign in
          </Link>
          <span className="eyebrow">
            <KeyRound size={14} /> Client registration
          </span>
          <h2>Create client access</h2>
          <p className="muted">
            Use the access code provided by your Product Manager.
          </p>
          <form
            className="form-stack"
            onSubmit={handleSubmit((value) => createAccount.mutate(value))}
          >
            <label>
              Full name
              <input {...register("name")} autoComplete="name" />
            </label>
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
            <label>
              Email
              <input {...register("email")} type="email" autoComplete="email" />
            </label>
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
            )}
            <label>
              Password
              <input
                {...register("password")}
                type="password"
                autoComplete="new-password"
              />
            </label>
            {errors.password && (
              <span className="field-error">{errors.password.message}</span>
            )}
            <label>
              Project access code
              <input
                {...register("projectAccessCode")}
                placeholder="NUSA-CLIENT-2026"
              />
            </label>
            {errors.projectAccessCode && (
              <span className="field-error">
                {errors.projectAccessCode.message}
              </span>
            )}
            <button
              className="button button-primary button-wide"
              disabled={createAccount.isPending}
              type="submit"
            >
              {createAccount.isPending ? "Creating account…" : "Create account"}
              <ArrowRight size={17} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
