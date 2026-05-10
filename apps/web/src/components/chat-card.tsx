"use client";

import { motion } from "framer-motion";
import { LoaderCircle, MessageSquareText, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { chatWithDocument } from "@/lib/api";
import type { ChatAnswer, SummaryRecord } from "@/types";

interface ChatCardProps {
  record: SummaryRecord | null;
}

const PROMPTS = [
  "What are the biggest risks in this document?",
  "Give me the top action items.",
  "What changed or stands out the most?"
];

export function ChatCard({ record }: ChatCardProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<ChatAnswer | null>(null);
  const [loading, setLoading] = useState(false);

  async function askDocument(nextQuestion: string) {
    if (!record) {
      toast.error("Generate or open a summary before starting document chat.");
      return;
    }

    setQuestion(nextQuestion);
    setLoading(true);

    try {
      const response = await chatWithDocument({
        question: nextQuestion,
        summaryId: record.userId ? record.id : undefined,
        documentText: record.userId ? undefined : record.sourceText,
        language: record.language
      });

      setAnswer(response);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Document chat failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.1 }}
      className="surface p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Document Chat</p>
          <h3 className="mt-4 font-display text-2xl font-semibold">Interrogate the source, not just the summary</h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            Ask targeted questions and keep answers grounded in the uploaded text or PDF context.
          </p>
        </div>
        <div className="rounded-3xl bg-accentSoft p-3 text-accent">
          <MessageSquareText className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => void askDocument(prompt)}
              className="rounded-full border border-stroke bg-bg/35 px-3 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask something specific about the document..."
            className="min-h-[120px] w-full rounded-[24px] border border-stroke bg-bg/40 px-4 py-3 text-sm leading-7 outline-none transition focus:border-accent"
          />

          <button
            type="button"
            onClick={() => void askDocument(question)}
            disabled={loading || !question.trim()}
            className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Ask the document
          </button>
        </div>

        <div className="surface-soft min-h-[220px] p-5">
          {answer ? (
            <div className="space-y-5">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Answer</h4>
                <p className="mt-3 text-sm leading-7">{answer.answer}</p>
              </div>

              {answer.bullets.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Supporting points</h4>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                    {answer.bullets.map((bullet) => (
                      <li key={bullet}>• {bullet}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {answer.suggestions.length > 0 ? (
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Next questions</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {answer.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => void askDocument(suggestion)}
                        className="rounded-full border border-stroke px-3 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex h-full min-h-[180px] items-center justify-center">
              <p className="max-w-sm text-center text-sm leading-6 text-muted">
                Run a summary first, then ask follow-up questions about the source document to surface risks, actions,
                or hidden details.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

