import { createClient } from "@/lib/supabase/client";
import type { Answer, CompletionStatus, FormResponse } from "@/lib/types";

export async function loadResponses(formId: string): Promise<FormResponse[]> {
  const supabase = createClient();
  const [{ data: responseRows }, { data: answerRows }] = await Promise.all([
    supabase.from("responses").select("*").eq("form_id", formId).order("started_at", { ascending: false }),
    supabase.from("answers").select("*").eq("form_id", formId),
  ]);

  const answersByResponse = new Map<string, Answer[]>();
  for (const row of answerRows ?? []) {
    const list = answersByResponse.get(row.response_id) ?? [];
    list.push({ questionId: row.question_id, value: row.value });
    answersByResponse.set(row.response_id, list);
  }

  return (responseRows ?? []).map((row) => ({
    id: row.id,
    formId: row.form_id,
    sessionId: row.session_id,
    answers: answersByResponse.get(row.id) ?? [],
    startedAt: row.started_at,
    completedAt: row.completed_at ?? undefined,
    completionStatus: row.completion_status as CompletionStatus,
    lastQuestionId: row.last_question_id ?? undefined,
  }));
}
