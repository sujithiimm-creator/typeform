"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import type { AnswerValue, FormSchema } from "@/lib/types";
import {
  computeProgress,
  getFirstQuestion,
  resolveNextQuestion,
  resolvePreviousQuestion,
  type AnswerMap,
} from "@/lib/logic/engine";
import { getQuestionModule } from "@/lib/questions/registry";
import { clearProgress, loadProgress, saveProgress } from "./storage";
import { createNoopPersistence, createSupabasePersistence, type ResponsePersistence } from "./persistence";

export type RespondentStage = "welcome" | "question" | "complete";

export interface UseRespondentOptions {
  schema: FormSchema;
  /** Preview mode never persists real rows and never resumes/saves local progress. */
  preview?: boolean;
}

export function useRespondent({ schema, preview = false }: UseRespondentOptions) {
  const persistence = useMemo<ResponsePersistence>(
    () => (preview ? createNoopPersistence() : createSupabasePersistence()),
    [preview]
  );

  const sessionIdRef = useRef<string>("");
  const [sessionId, setSessionId] = useState("");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [stage, setStage] = useState<RespondentStage>(schema.theme.welcomeScreen.enabled ? "welcome" : "question");
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const startedRef = useRef(false);

  // Resume progress from localStorage (real mode only) — this syncs React
  // state from an external system (browser storage) on mount, which is
  // exactly the "subscribe to an external system" case effects are for.
  /* eslint-disable react-hooks/set-state-in-effect --
     This effect's whole job is syncing React state from an external system
     (localStorage) on mount, which is exactly the "subscribe to updates
     from an external system" case the rule's own guidance carves out. */
  useEffect(() => {
    if (preview) {
      const first = getFirstQuestion(schema, {});
      sessionIdRef.current = "preview";
      setSessionId("preview");
      setCurrentQuestionId(first?.id ?? null);
      return;
    }
    const saved = loadProgress(schema.id);
    if (saved) {
      sessionIdRef.current = saved.sessionId;
      setSessionId(saved.sessionId);
      setAnswers(saved.answers);
      if (saved.currentQuestionId) {
        setStage("question");
        setCurrentQuestionId(saved.currentQuestionId);
      }
    } else {
      const id = nanoid(21);
      sessionIdRef.current = id;
      setSessionId(id);
      const first = getFirstQuestion(schema, {});
      setCurrentQuestionId(first?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema.id, preview]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist progress locally whenever it changes (real mode only).
  useEffect(() => {
    if (preview || !sessionIdRef.current) return;
    saveProgress(schema.id, {
      sessionId: sessionIdRef.current,
      currentQuestionId,
      answers,
      updatedAt: new Date().toISOString(),
    });
  }, [schema.id, preview, currentQuestionId, answers]);

  const currentQuestion = useMemo(
    () => schema.questions.find((q) => q.id === currentQuestionId) ?? null,
    [schema.questions, currentQuestionId]
  );

  const progress = useMemo(
    () => computeProgress(schema, currentQuestionId, answers),
    [schema, currentQuestionId, answers]
  );

  const setAnswer = useCallback((questionId: string, value: AnswerValue) => {
    setError(null);
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const ensureStarted = useCallback(async () => {
    if (startedRef.current || preview) return;
    startedRef.current = true;
    await persistence.start(schema.id, sessionIdRef.current);
  }, [persistence, schema.id, preview]);

  const begin = useCallback(async () => {
    await ensureStarted();
    const first = getFirstQuestion(schema, answers);
    setCurrentQuestionId(first?.id ?? null);
    setStage(first ? "question" : "complete");
  }, [ensureStarted, schema, answers]);

  const goNext = useCallback(async () => {
    if (!currentQuestion) return;
    const mod = getQuestionModule(currentQuestion.type);
    const value = answers[currentQuestion.id];
    const validationError = mod.validate(currentQuestion, value ?? null);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    await ensureStarted();
    if (mod.isQuestion) {
      await persistence.saveAnswer(schema.id, sessionIdRef.current, currentQuestion.id, value ?? null);
    }
    await persistence.touch(schema.id, sessionIdRef.current, currentQuestion.id);

    const result = resolveNextQuestion(schema, currentQuestion.id, answers);
    if (result.ended || !result.nextQuestionId) {
      await persistence.complete(schema.id, sessionIdRef.current);
      setStage("complete");
      setCurrentQuestionId(null);
      if (!preview) clearProgress(schema.id);
      return;
    }
    setHistory((prev) => [...prev, currentQuestion.id]);
    setCurrentQuestionId(result.nextQuestionId);
  }, [currentQuestion, answers, ensureStarted, persistence, schema, preview]);

  const goBack = useCallback(() => {
    if (!currentQuestionId) return;
    setError(null);
    const prevFromHistory = history[history.length - 1];
    if (prevFromHistory) {
      setHistory((prev) => prev.slice(0, -1));
      setCurrentQuestionId(prevFromHistory);
      return;
    }
    const prev = resolvePreviousQuestion(schema, currentQuestionId, answers);
    setCurrentQuestionId(prev);
    if (!prev) setStage(schema.theme.welcomeScreen.enabled ? "welcome" : "question");
  }, [currentQuestionId, history, schema, answers]);

  const canGoBack = stage === "question" && (history.length > 0 || resolvePreviousQuestion(schema, currentQuestionId ?? "", answers) !== null);

  return {
    stage,
    currentQuestion,
    answers,
    error,
    progress,
    canGoBack,
    setAnswer,
    begin,
    goNext,
    goBack,
    sessionId,
  };
}
