"use client";

import type { AnswerMap } from "@/lib/logic/engine";

interface StoredProgress {
  sessionId: string;
  currentQuestionId: string | null;
  answers: AnswerMap;
  updatedAt: string;
}

function key(formId: string) {
  return `formic:progress:${formId}`;
}

export function loadProgress(formId: string): StoredProgress | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key(formId));
    if (!raw) return null;
    return JSON.parse(raw) as StoredProgress;
  } catch {
    return null;
  }
}

export function saveProgress(formId: string, progress: StoredProgress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key(formId), JSON.stringify(progress));
  } catch {
    // Storage unavailable (private mode, quota) — fail silently, respondent
    // simply won't resume on refresh.
  }
}

export function clearProgress(formId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key(formId));
  } catch {
    // ignore
  }
}

export type { StoredProgress };
