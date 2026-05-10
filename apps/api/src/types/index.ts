export type SummaryLength = "short" | "medium" | "long";
export type SourceType = "text" | "pdf" | "mixed";

export interface SummarySection {
  heading: string;
  content: string;
  bullets: string[];
}

export interface StructuredSummary {
  title: string;
  overview: string;
  bullets: string[];
  sections: SummarySection[];
  takeaways: string[];
}

export interface SummarySource {
  sourceType: SourceType;
  sourceNames: string[];
  wordCount: number;
  estimatedReadTime: number;
}

export interface SummaryRecord {
  id: string;
  userId: string | null;
  sourceText: string;
  source: SummarySource;
  summary: StructuredSummary;
  keywords: string[];
  language: string;
  length: SummaryLength;
  createdAt: string;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
}

export interface ChatAnswer {
  answer: string;
  bullets: string[];
  suggestions: string[];
}

