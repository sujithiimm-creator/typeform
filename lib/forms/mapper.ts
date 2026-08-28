import type { FormSchema, LogicRule, Question, ThemeConfig } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/types";

/** Minimal shape of a `forms` row as returned by supabase-js (untyped client). */
export interface FormRow {
  id: string;
  owner_id: string;
  slug: string;
  title: string;
  description: string | null;
  status: "draft" | "published" | "closed";
  questions: unknown;
  logic_rules: unknown;
  theme: unknown;
  created_at: string;
  updated_at: string;
}

export function rowToSchema(row: FormRow): FormSchema {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    title: row.title,
    description: row.description ?? undefined,
    status: row.status,
    questions: (Array.isArray(row.questions) ? row.questions : []) as Question[],
    logicRules: (Array.isArray(row.logic_rules) ? row.logic_rules : []) as LogicRule[],
    theme: { ...DEFAULT_THEME, ...(typeof row.theme === "object" && row.theme ? row.theme : {}) } as ThemeConfig,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "form"
  );
}
