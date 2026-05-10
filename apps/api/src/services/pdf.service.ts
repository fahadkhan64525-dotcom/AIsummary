import pdf from "pdf-parse";
import { normalizeWhitespace } from "../utils/text.js";

export async function extractTextFromPdfFiles(files: Express.Multer.File[]) {
  const extracted: string[] = [];
  const fileNames: string[] = [];

  for (const file of files) {
    if (file.mimetype !== "application/pdf") {
      continue;
    }

    const data = await pdf(file.buffer);
    const text = normalizeWhitespace(data.text ?? "");

    if (text) {
      extracted.push(text);
      fileNames.push(file.originalname);
    }
  }

  return {
    text: extracted.join("\n\n"),
    fileNames
  };
}

