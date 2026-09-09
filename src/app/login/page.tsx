"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  LockKeyhole,
  Waves,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api, getErrorMessage } from "@/lib/api";
import type { ApiEnvelope, User } from "@/lib/types";
import { useAuthStore } from "@/store/auth";

const schema = z.object({
  email: z.email("Masukkan email yang valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { token, setSession } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  useEffect(() => {
    if (token) {
      // biome-ignore lint/suspicious/noDocumentCookie: restores the non-sensitive Proxy hint when local storage survives cookie cleanup
      document.cookie =
        "nodewave_session_hint=1; Path=/; Max-Age=28800; SameSite=Lax";
      router.replace("/dashboard");
    }
  }, [router, token]);

  const login = useMutation({
    mutationFn: async (input: FormData) => {
      const { data } = await api.post<
        ApiEnvelope<{ token: string; user: User }>
      >("/auth/login", input);
      return data.data;
    },
    onSuccess: ({ token: nextToken, user }) => {
      queryClient.clear();
      setSession(nextToken, user);
      router.replace("/dashboard");
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="brand brand-light">
          <span className="brand-mark">
            <Waves size={21} />
          </span>{" "}
          nodewave
        </div>
        <div className="story-copy">
          <span className="eyebrow eyebrow-light">
            <CircleDot size={14} /> Delivery operating system
          </span>
          <h1>Keep complex delivery moving, with every dependency visible.</h1>
          <p>
            One shared view for product, design, engineering, and clients—built
            around the rules that keep work reliable.
          </p>
          <div className="story-points">
            <span>
              <CheckCircle2 /> State-aware permissions
            </span>
            <span>
              <CheckCircle2 /> Conflict-safe updates
            </span>
            <span>
              <CheckCircle2 /> Client data isolation
            </span>
          </div>
        </div>
        <p className="story-foot">Assessment build · September 2026</p>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <span className="eyebrow">
            <LockKeyhole size={14} /> Secure workspace
          </span>
          <h2>Welcome back</h2>
          <p className="muted">
            Sign in to continue to your delivery workspace.
          </p>
          <form
            onSubmit={handleSubmit((data) => login.mutate(data))}
            className="form-stack"
          >
            <label>
              Email
              <input type="email" autoComplete="email" {...register("email")} />
            </label>
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
            )}
            <label>
              Password
              <input
                type="password"
                autoComplete="current-password"
                {...register("password")}
              />
            </label>
            {errors.password && (
              <span className="field-error">{errors.password.message}</span>
            )}
            <button
              className="button button-primary button-wide"
              disabled={login.isPending}
              type="submit"
            >
              {login.isPending ? "Signing in…" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            Client baru?{" "}
            <Link href="/register">Register dengan project access code</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
