import Papa from "papaparse";
import type { FormResponse, Question } from "@/lib/types";

function answerToCell(question: Question | undefined, value: unknown): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return value.join("; ");
  return String(value);
}

export function responsesToRows(questions: Question[], responses: FormResponse[]) {
  const ordered = [...questions].sort((a, b) => a.position - b.position);
  return responses.map((r) => {
    const row: Record<string, string> = {
      response_id: r.id,
      session_id: r.sessionId,
      status: r.completionStatus,
      started_at: r.startedAt,
      completed_at: r.completedAt ?? "",
    };
    for (const q of ordered) {
      const answer = r.answers.find((a) => a.questionId === q.id);
      row[q.title || q.id] = answerToCell(q, answer?.value);
    }
    return row;
  });
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * CSV export. We use a plain CSV with a UTF-8 BOM prefix (rather than pulling
 * in a full xlsx library) so it opens correctly in Excel with special
 * characters intact — a lightweight, dependency-free "Excel-compatible"
 * export. See README for the rationale.
 */
export function exportCsv(formTitle: string, questions: Question[], responses: FormResponse[]) {
  const rows = responsesToRows(questions, responses);
  const csv = Papa.unparse(rows);
  download(`${formTitle || "responses"}.csv`, "﻿" + csv, "text/csv;charset=utf-8;");
}

export function exportJson(formTitle: string, questions: Question[], responses: FormResponse[]) {
  const rows = responsesToRows(questions, responses);
  download(`${formTitle || "responses"}.json`, JSON.stringify(rows, null, 2), "application/json");
}
