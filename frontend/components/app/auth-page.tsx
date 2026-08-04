"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ShieldCheck } from "lucide-react";
import { authApi } from "../../lib/api";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  currentPassword: z.string().min(8).optional(),
  token: z.string().optional()
});

type AuthValues = z.infer<typeof authSchema>;

export function AuthPage({
  title,
  mode,
  submitLabel
}: {
  title: string;
  mode: "login" | "register" | "email" | "reset" | "verify" | "change";
  submitLabel: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      token: searchParams.get("token") ?? ""
    }
  });

  async function submit(values: AuthValues) {
    setError(null);
    setMessage(null);
    try {
      if (mode === "login") {
        await authApi.login({ email: values.email, password: values.password });
        router.push("/dashboard");
        return;
      }
      if (mode === "register") {
        await authApi.register({ name: values.name, email: values.email, password: values.password });
        setMessage("Registration submitted. Check email verification before production access.");
        return;
      }
      if (mode === "email") {
        await authApi.forgotPassword({ email: values.email });
        setMessage("Password reset instructions have been requested.");
        return;
      }
      if (mode === "reset") {
        await authApi.resetPassword({ token: values.token, password: values.password });
        setMessage("Password reset completed.");
        return;
      }
      if (mode === "verify") {
        await authApi.verifyEmail({ token: values.token });
        router.push("/verification-success");
        return;
      }
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.password });
      setMessage("Password changed successfully.");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication request failed");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <Card className="w-full max-w-md glass">
        <CardHeader className="space-y-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(submit)}>
            {mode === "register" && (
              <Field error={errors.name?.message}>
                <Input placeholder="Business name" {...register("name")} />
              </Field>
            )}
            {(mode === "login" || mode === "register" || mode === "email") && (
              <Field error={errors.email?.message}>
                <Input placeholder="Email address" type="email" {...register("email")} />
              </Field>
            )}
            {mode === "change" && (
              <Field error={errors.currentPassword?.message}>
                <Input placeholder="Current password" type="password" {...register("currentPassword")} />
              </Field>
            )}
            {(mode === "login" || mode === "register" || mode === "reset" || mode === "change") && (
              <Field error={errors.password?.message}>
                <Input placeholder={mode === "change" ? "New password" : "Password"} type="password" {...register("password")} />
              </Field>
            )}
            {(mode === "reset" || mode === "verify") && (
              <Field error={errors.token?.message}>
                <Input placeholder="Secure token" {...register("token")} />
              </Field>
            )}
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processing" : submitLabel}
            </Button>
          </form>
          {message && <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
          {error && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
            <Link href="/forgot-password">Forgot password</Link>
            <Link href="/dashboard">Dashboard</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function Field({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
