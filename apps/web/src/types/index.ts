export type SummaryLength = "short" | "medium" | "long";

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
  sourceType: "text" | "pdf" | "mixed";
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

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SummaryCreateResponse {
  saved: boolean;
  record: SummaryRecord;
}

export interface HistoryResponse {
  items: SummaryRecord[];
}

export interface SummaryResponse {
  item: SummaryRecord;
}

export interface AuthResponse {
  user: PublicUser | null;
}

export interface ChatAnswer {
  answer: string;
  bullets: string[];
  suggestions: string[];
}

