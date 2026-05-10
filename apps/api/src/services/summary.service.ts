import { randomUUID } from "node:crypto";
import { Types } from "mongoose";
import { env } from "../config/env.js";
import { ensureDatabaseConnection } from "../lib/database.js";
import { memoryStore } from "../lib/memory-store.js";
import { getOpenAIClient } from "../lib/openai.js";
import { SummaryModel } from "../models/Summary.js";
import type { StructuredSummary, SummaryLength, SummaryRecord, SummarySource, SourceType } from "../types/index.js";
import {
  createFallbackStructuredSummary,
  estimateReadTime,
  extractKeywords,
  getWordCount,
  normalizeWhitespace,
  parseJsonFromModel,
  sanitizeStructuredSummary,
  splitTextIntoChunks,
  trimToLimit
} from "../utils/text.js";

interface CreateSummaryInput {
  text: string;
  sourceType: SourceType;
  sourceNames: string[];
  length: SummaryLength;
  language: string;
  userId: string | null;
}

function lengthProfile(length: SummaryLength) {
  if (length === "short") {
    return {
      maxOutputTokens: 900,
      chunkWordTarget: 140,
      sections: 2,
      bullets: 3
    };
  }

  if (length === "long") {
    return {
      maxOutputTokens: 1800,
      chunkWordTarget: 260,
      sections: 4,
      bullets: 7
    };
  }

  return {
    maxOutputTokens: 1300,
    chunkWordTarget: 190,
    sections: 3,
    bullets: 5
  };
}

function buildSource(sourceType: SourceType, sourceNames: string[], wordCount: number): SummarySource {
  return {
    sourceType,
    sourceNames,
    wordCount,
    estimatedReadTime: estimateReadTime(wordCount)
  };
}

async function summarizeChunk(chunk: string, language: string, length: SummaryLength) {
  const client = getOpenAIClient();
  const profile = lengthProfile(length);

  if (!client) {
    return trimToLimit(chunk, 1200);
  }

  const response = await client.responses.create({
    model: env.OPENAI_MODEL,
    instructions:
      "You condense long documents into faithful chunk summaries. Preserve names, numbers, and concrete decisions.",
    input: `Summarize the following document chunk in ${language}. Keep it under ${profile.chunkWordTarget} words and focus on the most important facts.\n\n${chunk}`,
    max_output_tokens: Math.max(300, Math.round(profile.maxOutputTokens / 2))
  });

  return response.output_text?.trim() || trimToLimit(chunk, 1200);
}

async function generateAiStructuredSummary(text: string, language: string, length: SummaryLength) {
  const client = getOpenAIClient();

  if (!client) {
    return null;
  }

  const profile = lengthProfile(length);
  const chunks = splitTextIntoChunks(text, 1400).slice(0, 6);
  const chunkSummaries =
    chunks.length === 1
      ? [trimToLimit(chunks[0], env.MAX_SOURCE_CHARS)]
      : await Promise.all(chunks.map((chunk) => summarizeChunk(chunk, language, length)));

  const distilledText = chunkSummaries.join("\n\n");
  const prompt = [
    `Create a structured summary in ${language}.`,
    "Return valid JSON only.",
    "Use this exact shape:",
    JSON.stringify({
      title: "string",
      overview: "string",
      bullets: ["string"],
      sections: [
        {
          heading: "string",
          content: "string",
          bullets: ["string"]
        }
      ],
      takeaways: ["string"]
    }),
    `The summary length is ${length}.`,
    `Use ${profile.sections} sections and around ${profile.bullets} high-signal bullets.`,
    "Be clear, concise, and factually grounded.",
    "",
    "Document material:",
    distilledText
  ].join("\n");

  const response = await client.responses.create({
    model: env.OPENAI_MODEL,
    instructions:
      "You are a meticulous analyst. Produce clean JSON for premium product UIs. Do not include markdown or code fences.",
    input: prompt,
    max_output_tokens: profile.maxOutputTokens
  });

  return parseJsonFromModel<StructuredSummary>(response.output_text ?? "");
}

function mapSummaryRecord(record: {
  _id?: Types.ObjectId;
  id?: string;
  userId?: Types.ObjectId | string | null;
  sourceText: string;
  source: SummarySource;
  summary: StructuredSummary;
  keywords: string[];
  language: string;
  length: SummaryLength;
  createdAt: Date | string;
}): SummaryRecord {
  return {
    id: record.id ?? record._id?.toString() ?? randomUUID(),
    userId: record.userId ? record.userId.toString() : null,
    sourceText: record.sourceText,
    source: record.source,
    summary: record.summary,
    keywords: record.keywords,
    language: record.language,
    length: record.length,
    createdAt:
      record.createdAt instanceof Date ? record.createdAt.toISOString() : new Date(record.createdAt).toISOString()
  };
}

async function saveSummary(record: Omit<SummaryRecord, "id">) {
  if (await ensureDatabaseConnection()) {
    const doc = await SummaryModel.create({
      userId: record.userId ? new Types.ObjectId(record.userId) : null,
      sourceText: record.sourceText,
      source: record.source,
      summary: record.summary,
      keywords: record.keywords,
      language: record.language,
      length: record.length
    });

    return mapSummaryRecord(doc.toObject() as Parameters<typeof mapSummaryRecord>[0]);
  }

  const savedRecord: SummaryRecord = {
    id: randomUUID(),
    ...record
  };

  memoryStore.summaries.set(savedRecord.id, savedRecord);
  return savedRecord;
}

export async function createSummary(input: CreateSummaryInput) {
  const normalizedText = normalizeWhitespace(input.text);
  const safeText = trimToLimit(normalizedText, env.MAX_SOURCE_CHARS);
  const wordCount = getWordCount(safeText);

  if (!safeText) {
    throw new Error("Add text or upload at least one PDF before summarizing.");
  }

  const aiSummary = await generateAiStructuredSummary(safeText, input.language, input.length).catch(() => null);
  const structuredSummary = sanitizeStructuredSummary(aiSummary, safeText, input.length, input.language);
  const keywords = extractKeywords(`${safeText}\n${structuredSummary.overview}`, 8);

  const recordWithoutId: Omit<SummaryRecord, "id"> = {
    userId: input.userId,
    sourceText: safeText,
    source: buildSource(input.sourceType, input.sourceNames, wordCount),
    summary: structuredSummary,
    keywords,
    language: input.language,
    length: input.length,
    createdAt: new Date().toISOString()
  };

  if (!input.userId) {
    return {
      saved: false,
      record: {
        id: `guest-${randomUUID()}`,
        ...recordWithoutId
      }
    };
  }

  return {
    saved: true,
    record: await saveSummary(recordWithoutId)
  };
}

export async function listSummariesByUser(userId: string) {
  if (await ensureDatabaseConnection()) {
    const docs = await SummaryModel.find({ userId }).sort({ createdAt: -1 });
    return docs.map((doc) => mapSummaryRecord(doc.toObject() as Parameters<typeof mapSummaryRecord>[0]));
  }

  return [...memoryStore.summaries.values()]
    .filter((summary) => summary.userId === userId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function findSummaryById(summaryId: string) {
  if (await ensureDatabaseConnection()) {
    if (!Types.ObjectId.isValid(summaryId)) {
      return null;
    }

    const doc = await SummaryModel.findById(summaryId);
    return doc ? mapSummaryRecord(doc.toObject() as Parameters<typeof mapSummaryRecord>[0]) : null;
  }

  return memoryStore.summaries.get(summaryId) ?? null;
}

export async function deleteSummary(summaryId: string, userId: string) {
  if (await ensureDatabaseConnection()) {
    if (!Types.ObjectId.isValid(summaryId)) {
      return false;
    }

    const result = await SummaryModel.deleteOne({
      _id: summaryId,
      userId
    });

    return result.deletedCount > 0;
  }

  const existing = memoryStore.summaries.get(summaryId);

  if (!existing || existing.userId !== userId) {
    return false;
  }

  memoryStore.summaries.delete(summaryId);
  return true;
}

export function createLocalFallbackPreview(text: string, length: SummaryLength, language: string) {
  const summary = createFallbackStructuredSummary(text, length, language);
  return {
    summary,
    keywords: extractKeywords(`${text}\n${summary.overview}`)
  };
}
