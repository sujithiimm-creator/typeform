"use client";

import { createClient } from "@/lib/supabase/client";
import type { AnswerValue } from "@/lib/types";

export interface ResponsePersistence {
  /** Ensure a response row exists for this session; idempotent. */
  start: (formId: string, sessionId: string) => Promise<void>;
  /** Upsert a single answer. */
  saveAnswer: (formId: string, sessionId: string, questionId: string, value: AnswerValue) => Promise<void>;
  /** Mark the response complete. */
  complete: (formId: string, sessionId: string) => Promise<void>;
  /** Update the last-seen question id, for drop-off analytics. */
  touch: (formId: string, sessionId: string, lastQuestionId: string) => Promise<void>;
}

/** Real persistence: writes to Supabase `responses` / `answers` tables. */
export function createSupabasePersistence(): ResponsePersistence {
  const supabase = createClient();

  return {
    async start(formId, sessionId) {
      await supabase
        .from("responses")
        .upsert(
          { form_id: formId, session_id: sessionId, completion_status: "in_progress" },
          { onConflict: "form_id,session_id", ignoreDuplicates: true }
        );
    },
    async saveAnswer(formId, sessionId, questionId, value) {
      const { data: response } = await supabase
        .from("responses")
        .select("id")
        .eq("form_id", formId)
        .eq("session_id", sessionId)
        .maybeSingle();
      if (!response) return;
      await supabase.from("answers").upsert(
        {
          response_id: response.id,
          form_id: formId,
          question_id: questionId,
          value: value as never,
        },
        { onConflict: "response_id,question_id" }
      );
    },
    async complete(formId, sessionId) {
      await supabase
        .from("responses")
        .update({ completion_status: "completed", completed_at: new Date().toISOString() })
        .eq("form_id", formId)
        .eq("session_id", sessionId);
    },
    async touch(formId, sessionId, lastQuestionId) {
      await supabase
        .from("responses")
        .update({ last_question_id: lastQuestionId })
        .eq("form_id", formId)
        .eq("session_id", sessionId);
    },
  };
}

/** No-op persistence used by the builder's preview mode — never writes real rows. */
export function createNoopPersistence(): ResponsePersistence {
  return {
    async start() {},
    async saveAnswer() {},
    async complete() {},
    async touch() {},
  };
}
