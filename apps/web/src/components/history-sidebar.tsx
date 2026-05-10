"use client";

import { motion } from "framer-motion";
import { Clock3, LockKeyhole, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SummaryRecord } from "@/types";

interface HistorySidebarProps {
  items: SummaryRecord[];
  activeId: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  onSelect: (record: SummaryRecord) => void;
  onDelete: (summaryId: string) => void;
  onOpenAuth: () => void;
}

export function HistorySidebar({
  items,
  activeId,
  loading,
  isAuthenticated,
  onSelect,
  onDelete,
  onOpenAuth
}: HistorySidebarProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.15 }}
      className="surface h-full p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Summary History</p>
          <h3 className="mt-4 font-display text-2xl font-semibold">Saved runs</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            Review past summaries, reopen source context, and keep a lightweight knowledge base.
          </p>
        </div>
        <div className="rounded-3xl bg-accentSoft p-3 text-accent">
          <Clock3 className="h-5 w-5" />
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="mt-6 rounded-[24px] border border-dashed border-stroke bg-bg/35 p-5">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <LockKeyhole className="h-4 w-4 text-accent" />
            Sign in to store history
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            Guest summaries still work, but saved history and cross-session recall require an account.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="mt-4 inline-flex items-center rounded-2xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Open auth
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="rounded-[24px] border border-stroke bg-bg/35 p-5 text-sm text-muted">Loading history...</div>
          ) : items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "rounded-[24px] border p-4 transition",
                  activeId === item.id ? "border-accent bg-accent/10" : "border-stroke bg-bg/35 hover:border-accent/30"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => onSelect(item)} className="min-w-0 flex-1 text-left">
                    <p className="truncate font-semibold">{item.summary.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">{item.length} brief</p>
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-2xl text-muted transition hover:text-red-500"
                    aria-label="Delete summary"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <button type="button" onClick={() => onSelect(item)} className="mt-3 block w-full text-left">
                  <p className="line-clamp-2 text-sm leading-6 text-muted">{item.summary.overview}</p>
                </button>
                <p className="mt-4 text-xs text-muted">{formatDate(item.createdAt)}</p>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-stroke bg-bg/35 p-5 text-sm leading-6 text-muted">
              No saved summaries yet. Generate one while signed in and it will appear here automatically.
            </div>
          )}
        </div>
      )}
    </motion.aside>
  );
}
