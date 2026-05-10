import type {
  AuthResponse,
  ChatAnswer,
  HistoryResponse,
  PublicUser,
  SummaryCreateResponse,
  SummaryRecord,
  SummaryResponse
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  const isFormData = init?.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;

    try {
      const error = (await response.json()) as { message?: string };
      throw new Error(error.message ?? fallbackMessage);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error(fallbackMessage);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getCurrentUser() {
  return apiFetch<AuthResponse>("/auth/me");
}

export async function login(input: { email: string; password: string }) {
  const response = await apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return response.user as PublicUser;
}

export async function register(input: { name: string; email: string; password: string }) {
  const response = await apiFetch<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input)
  });

  return response.user as PublicUser;
}

export function logout() {
  return apiFetch<void>("/auth/logout", {
    method: "POST"
  });
}

export function createSummary(payload: FormData) {
  return apiFetch<SummaryCreateResponse>("/summaries", {
    method: "POST",
    body: payload
  });
}

export function listSummaries() {
  return apiFetch<HistoryResponse>("/summaries");
}

export function getSummary(summaryId: string) {
  return apiFetch<SummaryResponse>(`/summaries/${summaryId}`);
}

export function removeSummary(summaryId: string) {
  return apiFetch<void>(`/summaries/${summaryId}`, {
    method: "DELETE"
  });
}

export function chatWithDocument(input: {
  question: string;
  documentText?: string;
  summaryId?: string;
  language?: string;
}) {
  return apiFetch<ChatAnswer>("/summaries/chat", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function normalizeHistory(items: SummaryRecord[]) {
  return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

