"use client";

import { motion } from "framer-motion";
import { BrainCircuit, LogOut, ShieldCheck, Stars } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AuthDialog } from "@/components/auth-dialog";
import { useAuth } from "@/components/auth-context";
import { ChatCard } from "@/components/chat-card";
import { HistorySidebar } from "@/components/history-sidebar";
import { ResultPanel } from "@/components/result-panel";
import { SummaryForm } from "@/components/summary-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { listSummaries, normalizeHistory, removeSummary } from "@/lib/api";
import type { SummaryCreateResponse, SummaryRecord } from "@/types";

const STATS = [
  {
    label: "Input modes",
    value: "Text + PDF",
    icon: BrainCircuit
  },
  {
    label: "Output shape",
    value: "Cards + bullets",
    icon: Stars
  },
  {
    label: "Trust model",
    value: "AI + fallback",
    icon: ShieldCheck
  }
];

export function DashboardShell() {
  const { user, loading, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<SummaryRecord | null>(null);
  const [history, setHistory] = useState<SummaryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setHistory([]);
      return;
    }

    let ignore = false;

    async function loadHistory() {
      setHistoryLoading(true);

      try {
        const response = await listSummaries();

        if (!ignore) {
          setHistory(normalizeHistory(response.items));
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error instanceof Error ? error.message : "Unable to load history.");
        }
      } finally {
        if (!ignore) {
          setHistoryLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      ignore = true;
    };
  }, [user]);

  function handleSummaryComplete(payload: SummaryCreateResponse) {
    setActiveRecord(payload.record);

    if (payload.saved) {
      setHistory((current) => normalizeHistory([payload.record, ...current.filter((item) => item.id !== payload.record.id)]));
    }
  }

  async function handleDelete(summaryId: string) {
    try {
      await removeSummary(summaryId);
      setHistory((current) => current.filter((item) => item.id !== summaryId));
      setActiveRecord((current) => (current?.id === summaryId ? null : current));
      toast.success("Summary removed from history.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to delete summary.");
    }
  }

  async function handleLogout() {
    try {
      await logout();
      setActiveRecord(null);
      toast.success("Signed out.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to sign out.");
    }
  }

  const totalSaved = history.length;
  const sourceMinutes = history.reduce((total, item) => total + item.source.estimatedReadTime, 0);

  return (
    <>
      <div className="mx-auto min-h-screen max-w-[1600px] px-4 py-6 md:px-6 md:py-8">
        <header className="surface bg-hero-radial px-6 py-5 md:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <p className="eyebrow">AI Text Summarization Platform</p>
              <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.02]">
                A premium summarization workspace for teams who move fast
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted md:text-base">
                Upload PDFs, distill long documents, extract keywords, chat with the source material, and keep a clean
                summary history in one startup-grade interface.
              </p>
            </div>

            <div className="flex flex-col gap-4 xl:items-end">
              <div className="flex flex-wrap items-center gap-3">
                <ThemeToggle />
                {loading ? (
                  <div className="label-chip">Checking session...</div>
                ) : user ? (
                  <>
                    <div className="surface-soft px-4 py-3">
                      <p className="text-sm font-semibold">{user.name}</p>
                      <p className="text-xs text-muted">{user.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleLogout()}
                      className="inline-flex items-center gap-2 rounded-2xl border border-stroke px-4 py-3 text-sm font-semibold text-text transition hover:border-accent/40 hover:text-accent"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAuthOpen(true)}
                    className="rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
                  >
                    Sign in to save history
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {STATS.map((stat) => (
                  <div key={stat.label} className="surface-soft min-w-[170px] p-4">
                    <stat.icon className="h-5 w-5 text-accent" />
                    <p className="mt-4 text-2xl font-semibold">{stat.value}</p>
                    <p className="mt-1 text-sm text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
          className="mt-6 grid gap-4 md:grid-cols-3"
        >
          <div className="surface-soft p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Saved summaries</p>
            <p className="mt-3 font-display text-4xl font-semibold">{totalSaved}</p>
            <p className="mt-2 text-sm text-muted">Persistent history becomes your searchable knowledge trail.</p>
          </div>
          <div className="surface-soft p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Reading time compressed</p>
            <p className="mt-3 font-display text-4xl font-semibold">{sourceMinutes} min</p>
            <p className="mt-2 text-sm text-muted">Estimated source reading time captured across saved sessions.</p>
          </div>
          <div className="surface-soft p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-muted">Active mode</p>
            <p className="mt-3 font-display text-4xl font-semibold">{user ? "Workspace" : "Guest"}</p>
            <p className="mt-2 text-sm text-muted">
              Guest mode still supports text, PDF parsing, summaries, export, and document chat.
            </p>
          </div>
        </motion.div>

        <main className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SummaryForm onComplete={handleSummaryComplete} onOpenAuth={() => setAuthOpen(true)} isAuthenticated={Boolean(user)} />
          <ResultPanel record={activeRecord} />
        </main>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.78fr]">
          <ChatCard record={activeRecord} />
          <HistorySidebar
            items={history}
            activeId={activeRecord?.id ?? null}
            loading={historyLoading}
            isAuthenticated={Boolean(user)}
            onSelect={setActiveRecord}
            onDelete={(summaryId) => void handleDelete(summaryId)}
            onOpenAuth={() => setAuthOpen(true)}
          />
        </section>
      </div>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
