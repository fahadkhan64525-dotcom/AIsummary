import type { SummaryRecord, StoredUser } from "../types/index.js";

export const memoryStore = {
  users: new Map<string, StoredUser>(),
  summaries: new Map<string, SummaryRecord>()
};

