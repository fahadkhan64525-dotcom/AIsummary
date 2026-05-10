"use client";

import { jsPDF } from "jspdf";
import { motion } from "framer-motion";
import { Copy, Download, FileText, Languages, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { buildShareText, formatDate } from "@/lib/utils";
import type { SummaryRecord } from "@/types";

interface ResultPanelProps {
  record: SummaryRecord | null;
}

function exportToPdf(record: SummaryRecord) {
  const document = new jsPDF({
    unit: "pt",
    format: "a4"
  });
  const margin = 48;
  const maxWidth = 500;
  let currentY = margin;

  function addBlock(text: string, fontSize = 12, spacing = 18) {
    document.setFontSize(fontSize);
    const lines = document.splitTextToSize(text, maxWidth);
    document.text(lines, margin, currentY);
    currentY += lines.length * spacing;
  }

  addBlock(record.summary.title, 20, 24);
  addBlock(`Language: ${record.language} • Length: ${record.length} • Created: ${formatDate(record.createdAt)}`, 10, 16);
  addBlock("", 10, 14);
  addBlock(record.summary.overview, 12, 18);
  addBlock("", 10, 14);
  addBlock("Key bullets", 14, 18);
  record.summary.bullets.forEach((bullet) => addBlock(`• ${bullet}`, 11, 16));
  addBlock("", 10, 14);
  record.summary.sections.forEach((section) => {
    addBlock(section.heading, 14, 18);
    addBlock(section.content, 11, 16);
    section.bullets.forEach((bullet) => addBlock(`• ${bullet}`, 10, 15));
    addBlock("", 10, 12);
  });
  addBlock(`Keywords: ${record.keywords.join(", ")}`, 10, 16);
  document.save(`${record.summary.title.toLowerCase().replace(/\s+/g, "-") || "summary"}.pdf`);
}

export function ResultPanel({ record }: ResultPanelProps) {
  async function handleCopy() {
    if (!record) {
      return;
    }

    await navigator.clipboard.writeText(buildShareText(record));
    toast.success("Summary copied to clipboard.");
  }

  async function handleShare() {
    if (!record) {
      return;
    }

    const shareText = buildShareText(record);

    if (navigator.share) {
      await navigator.share({
        title: record.summary.title,
        text: shareText
      });
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Share API unavailable, so the summary was copied instead.");
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.05 }}
      className="surface flex h-full flex-col p-6 md:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">AI Output</p>
          <h2 className="mt-4 font-display text-3xl font-semibold">Structured summary</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Designed for quick reading, stakeholder sharing, and follow-up exploration.
          </p>
        </div>

        {record ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stroke bg-bg/35 text-muted transition hover:border-accent/40 hover:text-accent"
              aria-label="Copy summary"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => exportToPdf(record)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stroke bg-bg/35 text-muted transition hover:border-accent/40 hover:text-accent"
              aria-label="Export as PDF"
            >
              <Download className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void handleShare()}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-stroke bg-bg/35 text-muted transition hover:border-accent/40 hover:text-accent"
              aria-label="Share summary"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>

      {!record ? (
        <div className="mt-8 flex flex-1 items-center justify-center rounded-[26px] border border-dashed border-stroke bg-bg/30 p-8">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-accentSoft text-accent">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold">Ready for the first summary</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Your AI-generated summary, key bullets, sections, and keywords will appear here as soon as you submit a
              document.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex-1 space-y-5">
          <div className="surface-soft p-5">
            <div className="flex flex-wrap gap-2 text-xs text-muted">
              <span className="label-chip">
                <FileText className="mr-2 inline h-3.5 w-3.5" />
                {record.source.sourceType.toUpperCase()}
              </span>
              <span className="label-chip">
                <Languages className="mr-2 inline h-3.5 w-3.5" />
                {record.language}
              </span>
              <span className="label-chip">{record.source.wordCount.toLocaleString()} words</span>
              <span className="label-chip">{record.source.estimatedReadTime} min read</span>
            </div>

            <h3 className="mt-4 font-display text-3xl font-semibold">{record.summary.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted md:text-base">{record.summary.overview}</p>
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-muted">{formatDate(record.createdAt)}</p>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="surface-soft p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Key bullets</h4>
              <ul className="mt-4 space-y-3">
                {record.summary.bullets.map((bullet) => (
                  <li key={bullet} className="rounded-2xl border border-stroke bg-bg/30 px-4 py-3 text-sm leading-6">
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-soft p-5">
              <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted">Keywords</h4>
              <div className="mt-4 flex flex-wrap gap-2">
                {record.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-accent/20 bg-accentSoft/70 px-3 py-1 text-sm text-accent">
                    {keyword}
                  </span>
                ))}
              </div>

              <h4 className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-muted">Takeaways</h4>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                {record.summary.takeaways.map((takeaway) => (
                  <li key={takeaway}>• {takeaway}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-4">
            {record.summary.sections.map((section) => (
              <div key={section.heading} className="surface-soft p-5">
                <h4 className="font-display text-xl font-semibold">{section.heading}</h4>
                <p className="mt-3 text-sm leading-7 text-muted">{section.content}</p>
                {section.bullets.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm leading-6">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="text-muted">
                        • {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
}

