import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { SummaryRecord } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function buildShareText(record: SummaryRecord) {
  return [
    record.summary.title,
    "",
    record.summary.overview,
    "",
    "Key bullets:",
    ...record.summary.bullets.map((bullet) => `- ${bullet}`),
    "",
    `Keywords: ${record.keywords.join(", ")}`
  ].join("\n");
}

