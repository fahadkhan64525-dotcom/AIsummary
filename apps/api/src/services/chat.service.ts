import { env } from "../config/env.js";
import { getOpenAIClient } from "../lib/openai.js";
import type { ChatAnswer } from "../types/index.js";
import { normalizeWhitespace, parseJsonFromModel, splitIntoSentences, trimToLimit } from "../utils/text.js";

function scoreSentence(sentence: string, queryTerms: string[]) {
  const lowerSentence = sentence.toLowerCase();
  return queryTerms.reduce((score, term) => score + (lowerSentence.includes(term) ? 1 : 0), 0);
}

function localDocumentAnswer(question: string, documentText: string): ChatAnswer {
  const queryTerms = question
    .toLowerCase()
    .match(/[a-z][a-z-]{2,}/g)
    ?.slice(0, 10) ?? [];
  const sentences = splitIntoSentences(documentText);
  const ranked = sentences
    .map((sentence) => ({
      sentence,
      score: scoreSentence(sentence, queryTerms)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, 4)
    .filter((item) => item.score > 0);

  if (ranked.length === 0) {
    return {
      answer: "I could not find a confident answer in the document text that was provided.",
      bullets: [],
      suggestions: ["Ask about a named section, fact, or topic that appears in the source material."]
    };
  }

  return {
    answer: ranked.map((item) => item.sentence).join(" "),
    bullets: ranked.slice(0, 3).map((item) => item.sentence),
    suggestions: [
      "Ask for a shorter answer",
      "Ask for risks or action items",
      "Ask what changed over time"
    ]
  };
}

export async function answerDocumentQuestion(question: string, documentText: string, language: string) {
  const safeQuestion = normalizeWhitespace(question);
  const safeDocument = trimToLimit(normalizeWhitespace(documentText), env.MAX_SOURCE_CHARS);
  const client = getOpenAIClient();

  if (!client) {
    return localDocumentAnswer(safeQuestion, safeDocument);
  }

  try {
    const response = await client.responses.create({
      model: env.OPENAI_MODEL,
      instructions:
        "You answer questions using only the supplied document. If the answer is not supported, say that clearly. Keep the response UI-friendly.",
      input: [
        `Question: ${safeQuestion}`,
        `Respond in ${language}.`,
        "Return valid JSON only with keys: answer, bullets, suggestions.",
        "",
        "Document:",
        safeDocument
      ].join("\n"),
      max_output_tokens: 900
    });

    const parsed = parseJsonFromModel<ChatAnswer>(response.output_text ?? "");

    if (!parsed) {
      return localDocumentAnswer(safeQuestion, safeDocument);
    }

    return {
      answer: parsed.answer?.trim() || localDocumentAnswer(safeQuestion, safeDocument).answer,
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 4) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : []
    };
  } catch {
    return localDocumentAnswer(safeQuestion, safeDocument);
  }
}
