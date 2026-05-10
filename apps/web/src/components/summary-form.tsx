"use client";

import { motion } from "framer-motion";
import { ArrowRight, Globe2, LoaderCircle, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createSummary } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SummaryCreateResponse, SummaryLength } from "@/types";
import { FileDropzone } from "./file-dropzone";

interface SummaryFormProps {
  onComplete: (payload: SummaryCreateResponse) => void;
  onOpenAuth: () => void;
  isAuthenticated: boolean;
}

const LENGTH_OPTIONS: { value: SummaryLength; label: string; description: string }[] = [
  { value: "short", label: "Short", description: "Fast executive brief" },
  { value: "medium", label: "Medium", description: "Balanced insight" },
  { value: "long", label: "Long", description: "Deep structured digest" }
];

const LANGUAGE_OPTIONS = ["English", "Hindi", "Spanish", "French", "German", "Japanese"];

export function SummaryForm({ onComplete, onOpenAuth, isAuthenticated }: SummaryFormProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [length, setLength] = useState<SummaryLength>("medium");
  const [language, setLanguage] = useState("English");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!text.trim() && files.length === 0) {
      toast.error("Paste some text or upload a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.set("text", text);
    formData.set("length", length);
    formData.set("language", language);
    files.forEach((file) => formData.append("files", file));

    setSubmitting(true);

    try {
      const response = await createSummary(formData);
      onComplete(response);
      toast.success(response.saved ? "Summary created and saved to history." : "Summary created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to summarize the document.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="surface p-6 md:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Summarization Studio</p>
          <h2 className="mt-4 font-display text-3xl font-semibold leading-tight md:text-[2rem]">
            Turn raw documents into clear, share-ready intelligence
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted md:text-base">
            Paste text, upload research PDFs, choose the output length, and get a polished summary with keywords,
            structured sections, and follow-up document chat.
          </p>
        </div>

        <div className="surface-soft w-full max-w-sm space-y-3 p-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-accent" />
            <p className="text-sm font-semibold">Workspace benefits</p>
          </div>
          <p className="text-sm text-muted">Authenticated users get persistent history, saved documents, and cleaner chat continuity.</p>
          {!isAuthenticated ? (
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex items-center gap-2 rounded-2xl border border-stroke px-4 py-2 text-sm font-semibold text-text transition hover:border-accent/40 hover:text-accent"
            >
              <LockKeyhole className="h-4 w-4" />
              Unlock saved history
            </button>
          ) : (
            <div className="label-chip">History sync is active</div>
          )}
        </div>
      </div>

      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
          <label className="block space-y-3">
            <span className="text-sm font-semibold text-muted">Source text</span>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste an article, meeting notes, product spec, or policy document..."
              className="min-h-[260px] w-full rounded-[24px] border border-stroke bg-bg/45 px-5 py-4 text-sm leading-7 text-text outline-none transition focus:border-accent"
            />
          </label>

          <div className="space-y-5">
            <div className="surface-soft p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-accent" />
                Summary length
              </div>
              <div className="mt-4 grid gap-2">
                {LENGTH_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLength(option.value)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition",
                      length === option.value
                        ? "border-accent bg-accent text-white"
                        : "border-stroke bg-bg/35 hover:border-accent/30"
                    )}
                  >
                    <div className="font-semibold">{option.label}</div>
                    <div className={cn("mt-1 text-sm", length === option.value ? "text-white/80" : "text-muted")}>
                      {option.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-soft p-4">
              <label className="space-y-3">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <Globe2 className="h-4 w-4 text-accent" />
                  Output language
                </span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  className="w-full rounded-2xl border border-stroke bg-bg/35 px-4 py-3 text-sm outline-none transition focus:border-accent"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <FileDropzone files={files} onFilesChange={setFiles} />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 text-xs text-muted">
            <span className="label-chip">AI summaries</span>
            <span className="label-chip">Keyword extraction</span>
            <span className="label-chip">Chat with document</span>
            <span className="label-chip">PDF-ready output</span>
          </div>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Generate summary
          </motion.button>
        </div>
      </form>
    </motion.section>
  );
}

