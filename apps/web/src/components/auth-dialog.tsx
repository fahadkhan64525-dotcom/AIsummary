"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth-context";
import { cn } from "@/lib/utils";

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

type AuthMode = "login" | "register";

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login({
          email: form.email,
          password: form.password
        });
        toast.success("Welcome back. Your workspace is ready.");
      } else {
        await register(form);
        toast.success("Account created. We’ll start saving your summaries now.");
      }

      onClose();
      setForm({
        name: "",
        email: "",
        password: ""
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="surface w-full max-w-xl overflow-hidden"
          >
            <div className="flex items-start justify-between border-b border-stroke px-6 py-5">
              <div>
                <p className="eyebrow">Secure Access</p>
                <h2 className="mt-3 font-display text-2xl font-semibold">Save, revisit, and share your summaries</h2>
                <p className="mt-2 text-sm text-muted">
                  Create an account to unlock summary history and cross-session document workflows.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-stroke text-muted transition hover:text-text"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="inline-flex rounded-2xl border border-stroke bg-card/70 p-1">
                {(["login", "register"] as AuthMode[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMode(item)}
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-semibold capitalize transition",
                      mode === item ? "bg-accent text-white" : "text-muted hover:text-text"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "register" ? (
                  <label className="block space-y-2 text-sm text-muted">
                    Full name
                    <input
                      required
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full rounded-2xl border border-stroke bg-bg/40 px-4 py-3 text-text outline-none transition focus:border-accent"
                      placeholder="Ava Thompson"
                    />
                  </label>
                ) : null}

                <label className="block space-y-2 text-sm text-muted">
                  Email
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full rounded-2xl border border-stroke bg-bg/40 px-4 py-3 text-text outline-none transition focus:border-accent"
                    placeholder="you@company.com"
                  />
                </label>

                <label className="block space-y-2 text-sm text-muted">
                  Password
                  <input
                    required
                    type="password"
                    minLength={8}
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full rounded-2xl border border-stroke bg-bg/40 px-4 py-3 text-text outline-none transition focus:border-accent"
                    placeholder="At least 8 characters"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  {mode === "login" ? "Sign in" : "Create account"}
                </button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

