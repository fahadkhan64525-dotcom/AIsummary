import { Router } from "express";
import { answerDocumentQuestion } from "../services/chat.service.js";
import { extractTextFromPdfFiles } from "../services/pdf.service.js";
import { createSummary, deleteSummary, findSummaryById, listSummariesByUser } from "../services/summary.service.js";
import type { SummaryLength } from "../types/index.js";
import { normalizeWhitespace } from "../utils/text.js";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const summaryRoutes = Router();

summaryRoutes.post("/", upload.array("files", 5), async (request, response) => {
  const textInput = typeof request.body.text === "string" ? request.body.text : "";
  const files = (request.files as Express.Multer.File[] | undefined) ?? [];
  const { text: pdfText, fileNames } = await extractTextFromPdfFiles(files);
  const mergedText = normalizeWhitespace([textInput, pdfText].filter(Boolean).join("\n\n"));

  const rawLength = typeof request.body.length === "string" ? request.body.length : "medium";
  const length = ["short", "medium", "long"].includes(rawLength) ? (rawLength as SummaryLength) : "medium";
  const language = typeof request.body.language === "string" && request.body.language.trim()
    ? request.body.language
    : "English";

  if (!mergedText) {
    return response.status(400).json({
      message: "Provide text or upload at least one PDF."
    });
  }

  const sourceType = textInput.trim() && pdfText ? "mixed" : pdfText ? "pdf" : "text";

  const result = await createSummary({
    text: mergedText,
    sourceType,
    sourceNames: fileNames,
    length,
    language,
    userId: request.user?.id ?? null
  });

  return response.status(201).json(result);
});

summaryRoutes.get("/", requireAuth, async (request, response) => {
  const items = await listSummariesByUser(request.user!.id);
  response.json({
    items
  });
});

summaryRoutes.get("/:summaryId", requireAuth, async (request, response) => {
  const item = await findSummaryById(String(request.params.summaryId));

  if (!item || item.userId !== request.user!.id) {
    return response.status(404).json({
      message: "Summary not found."
    });
  }

  return response.json({
    item
  });
});

summaryRoutes.delete("/:summaryId", requireAuth, async (request, response) => {
  const deleted = await deleteSummary(String(request.params.summaryId), request.user!.id);

  if (!deleted) {
    return response.status(404).json({
      message: "Summary not found."
    });
  }

  return response.status(204).send();
});

summaryRoutes.post("/chat", async (request, response) => {
  const { question, documentText, summaryId, language } = request.body as {
    question?: string;
    documentText?: string;
    summaryId?: string;
    language?: string;
  };

  if (!question?.trim()) {
    return response.status(400).json({
      message: "Ask a question to chat with the document."
    });
  }

  let sourceText = documentText?.trim() ?? "";

  if (!sourceText && summaryId) {
    const item = await findSummaryById(summaryId);

    if (!item) {
      return response.status(404).json({
        message: "Summary not found."
      });
    }

    if (item.userId && item.userId !== request.user?.id) {
      return response.status(403).json({
        message: "You do not have access to this summary."
      });
    }

    sourceText = item.sourceText;
  }

  if (!sourceText) {
    return response.status(400).json({
      message: "Document context is required for chat."
    });
  }

  const answer = await answerDocumentQuestion(question, sourceText, language?.trim() || "English");

  return response.json(answer);
});

export { summaryRoutes };
