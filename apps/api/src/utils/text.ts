import type { StructuredSummary, SummaryLength } from "../types/index.js";

const STOP_WORDS = new Set([
  "a",
  "about",
  "after",
  "all",
  "also",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "because",
  "been",
  "before",
  "being",
  "between",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "during",
  "each",
  "for",
  "from",
  "had",
  "has",
  "have",
  "if",
  "in",
  "into",
  "is",
  "it",
  "its",
  "more",
  "most",
  "no",
  "not",
  "of",
  "on",
  "or",
  "our",
  "out",
  "over",
  "should",
  "so",
  "some",
  "such",
  "than",
  "that",
  "the",
  "their",
  "them",
  "there",
  "these",
  "they",
  "this",
  "to",
  "under",
  "up",
  "very",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your"
]);

export function normalizeWhitespace(text: string) {
  return text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function getWordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

export function estimateReadTime(wordCount: number) {
  return Math.max(1, Math.ceil(wordCount / 220));
}

export function trimToLimit(text: string, maxCharacters: number) {
  if (text.length <= maxCharacters) {
    return text;
  }

  return `${text.slice(0, maxCharacters)}...`;
}

export function splitIntoSentences(text: string) {
  return normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 25);
}

export function splitTextIntoChunks(text: string, maxWordsPerChunk = 1400) {
  const paragraphs = normalizeWhitespace(text).split(/\n{2,}/).filter(Boolean);
  const chunks: string[] = [];
  let currentChunk = "";
  let currentWordCount = 0;

  for (const paragraph of paragraphs) {
    const paragraphWordCount = getWordCount(paragraph);
    if (currentWordCount + paragraphWordCount > maxWordsPerChunk && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
      currentWordCount = paragraphWordCount;
    } else {
      currentChunk += `${currentChunk ? "\n\n" : ""}${paragraph}`;
      currentWordCount += paragraphWordCount;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [normalizeWhitespace(text)];
}

export function extractKeywords(text: string, limit = 8) {
  const scores = new Map<string, number>();
  const words = normalizeWhitespace(text)
    .toLowerCase()
    .match(/[a-z][a-z-]{2,}/g);

  if (!words) {
    return [];
  }

  for (const word of words) {
    if (STOP_WORDS.has(word)) {
      continue;
    }

    scores.set(word, (scores.get(word) ?? 0) + 1);
  }

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function dedupeSentences(sentences: string[], limit: number) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    result.push(sentence);

    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

function titleFromText(text: string) {
  const firstSentence = splitIntoSentences(text)[0] ?? "AI Summary";
  const words = firstSentence
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 7);

  return words.length > 0 ? words.join(" ") : "AI Summary";
}

export function createFallbackStructuredSummary(
  text: string,
  length: SummaryLength,
  language: string
): StructuredSummary {
  const sentences = splitIntoSentences(text);
  const fallbackSentences = sentences.length > 0 ? sentences : [trimToLimit(text, 220)];
  const bulletCount = length === "short" ? 3 : length === "medium" ? 5 : 7;
  const sectionCount = length === "short" ? 2 : length === "medium" ? 3 : 4;
  const selected = dedupeSentences(fallbackSentences, Math.max(bulletCount + sectionCount * 2, 6));
  const sections = Array.from({ length: sectionCount }, (_, index) => {
    const slice = selected.slice(index * 2, index * 2 + 2);
    return {
      heading: ["Core Idea", "Evidence", "Implications", "Next Signals"][index] ?? `Section ${index + 1}`,
      content: slice[0] ?? selected[0] ?? trimToLimit(text, 240),
      bullets: slice.slice(1)
    };
  });

  const title = language.toLowerCase() === "english" ? titleFromText(text) : "AI Generated Summary";

  return {
    title,
    overview: selected[0] ?? trimToLimit(text, 300),
    bullets: dedupeSentences(selected, bulletCount),
    sections,
    takeaways: dedupeSentences(selected.slice(1), Math.max(3, Math.min(5, bulletCount)))
  };
}

export function parseJsonFromModel<T>(raw: string): T | null {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? raw;

  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

export function sanitizeStructuredSummary(
  maybeSummary: Partial<StructuredSummary> | null,
  fallbackText: string,
  length: SummaryLength,
  language: string
) {
  const fallback = createFallbackStructuredSummary(fallbackText, length, language);

  if (!maybeSummary) {
    return fallback;
  }

  return {
    title: maybeSummary.title?.trim() || fallback.title,
    overview: maybeSummary.overview?.trim() || fallback.overview,
    bullets: Array.isArray(maybeSummary.bullets) && maybeSummary.bullets.length > 0
      ? maybeSummary.bullets.map((item) => item.trim()).filter(Boolean).slice(0, 8)
      : fallback.bullets,
    sections: Array.isArray(maybeSummary.sections) && maybeSummary.sections.length > 0
      ? maybeSummary.sections.slice(0, 4).map((section, index) => ({
          heading: section.heading?.trim() || fallback.sections[index]?.heading || `Section ${index + 1}`,
          content: section.content?.trim() || fallback.sections[index]?.content || fallback.overview,
          bullets: Array.isArray(section.bullets)
            ? section.bullets.map((item) => item.trim()).filter(Boolean).slice(0, 4)
            : fallback.sections[index]?.bullets || []
        }))
      : fallback.sections,
    takeaways: Array.isArray(maybeSummary.takeaways) && maybeSummary.takeaways.length > 0
      ? maybeSummary.takeaways.map((item) => item.trim()).filter(Boolean).slice(0, 5)
      : fallback.takeaways
  };
}

