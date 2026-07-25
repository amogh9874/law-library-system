export const BOOK_TYPE_LABELS: Record<string, string> = {
  LAW_BOOK: "Law Book",
  BARE_ACT: "Bare Act",
  CASE_LAW: "Case Law",
  JOURNAL: "Journal",
  MANUAL: "Manual",
  COMMENTARY: "Commentary",
  RESEARCH_PAPER: "Research Paper",
  REFERENCE_BOOK: "Reference Book",
};

const NORMALIZED_LOOKUP: Record<string, string> = {};
for (const [code, label] of Object.entries(BOOK_TYPE_LABELS)) {
  NORMALIZED_LOOKUP[code.toLowerCase().replace(/[_\s]/g, "")] = code;
  NORMALIZED_LOOKUP[label.toLowerCase().replace(/[_\s]/g, "")] = code;
}

// Accepts "Law Book", "LAW_BOOK", "law book", "lawbook", etc. and returns the
// canonical enum code, or null if it doesn't match any known type.
export function normalizeBookType(input: string): string | null {
  const key = input.trim().toLowerCase().replace(/[_\s]/g, "");
  return NORMALIZED_LOOKUP[key] ?? null;
}

const CONDITION_LOOKUP: Record<string, string> = {
  new: "NEW",
  good: "GOOD",
  worn: "WORN",
  damaged: "DAMAGED",
};

export function normalizeCondition(input: string): string | null {
  return CONDITION_LOOKUP[input.trim().toLowerCase()] ?? null;
}
