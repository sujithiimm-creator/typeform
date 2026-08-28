/**
 * Pure logic engine. Operates only on FormSchema + the current answer map;
 * no React, no I/O. Used identically by the respondent engine (public form
 * + builder preview).
 */
import type {
  Answer,
  AnswerValue,
  FormSchema,
  LogicCondition,
  LogicConditionGroup,
  LogicRule,
  Question,
} from "@/lib/types";
import { isAnswerEmpty } from "@/lib/types";

export type AnswerMap = Record<string, AnswerValue>;

export function answersToMap(answers: Answer[]): AnswerMap {
  const map: AnswerMap = {};
  for (const a of answers) map[a.questionId] = a.value as AnswerValue;
  return map;
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function evaluateCondition(condition: LogicCondition, answers: AnswerMap): boolean {
  const raw = answers[condition.questionId];

  switch (condition.operator) {
    case "is_empty":
      return isAnswerEmpty(raw as AnswerValue);
    case "is_not_empty":
      return !isAnswerEmpty(raw as AnswerValue);
    case "equals": {
      if (Array.isArray(raw)) return raw.includes(String(condition.value));
      return String(raw ?? "") === String(condition.value ?? "");
    }
    case "not_equals": {
      if (Array.isArray(raw)) return !raw.includes(String(condition.value));
      return String(raw ?? "") !== String(condition.value ?? "");
    }
    case "contains": {
      if (Array.isArray(raw)) return raw.includes(String(condition.value));
      return String(raw ?? "").toLowerCase().includes(String(condition.value ?? "").toLowerCase());
    }
    case "not_contains": {
      if (Array.isArray(raw)) return !raw.includes(String(condition.value));
      return !String(raw ?? "").toLowerCase().includes(String(condition.value ?? "").toLowerCase());
    }
    case "greater_than": {
      const a = coerceNumber(raw);
      const b = coerceNumber(condition.value);
      if (a === null || b === null) return false;
      return a > b;
    }
    case "less_than": {
      const a = coerceNumber(raw);
      const b = coerceNumber(condition.value);
      if (a === null || b === null) return false;
      return a < b;
    }
    default:
      return false;
  }
}

export function evaluateGroup(group: LogicConditionGroup, answers: AnswerMap): boolean {
  if (group.conditions.length === 0) return true;
  if (group.combinator === "AND") {
    return group.conditions.every((c) => evaluateCondition(c, answers));
  }
  return group.conditions.some((c) => evaluateCondition(c, answers));
}

/** Rules whose source is `sourceQuestionId` (or global rules, sourceQuestionId=null), sorted by priority. */
function rulesFor(rules: LogicRule[], sourceQuestionId: string | null): LogicRule[] {
  return rules
    .filter((r) => r.sourceQuestionId === sourceQuestionId)
    .sort((a, b) => a.priority - b.priority);
}

export interface NextStepResult {
  /** null means the form is complete. */
  nextQuestionId: string | null;
  ended: boolean;
}

/**
 * Given the schema, the id of the question just answered (or null for the
 * very first step), and the current answers, resolve which question comes
 * next by walking the ordered question list and applying logic rules.
 */
export function resolveNextQuestion(
  schema: Pick<FormSchema, "questions" | "logicRules">,
  currentQuestionId: string | null,
  answers: AnswerMap
): NextStepResult {
  const ordered = [...schema.questions].sort((a, b) => a.position - b.position);
  if (ordered.length === 0) return { nextQuestionId: null, ended: true };

  // Evaluate rules attached to the question just answered first.
  if (currentQuestionId) {
    for (const rule of rulesFor(schema.logicRules, currentQuestionId)) {
      if (evaluateGroup(rule.group, answers)) {
        if (rule.action.type === "end") return { nextQuestionId: null, ended: true };
        if (rule.action.type === "jump" || rule.action.type === "show") {
          const targetId = rule.action.targetQuestionId;
          const target = ordered.find((q) => q.id === targetId);
          if (target && isQuestionVisible(target, schema.logicRules, answers)) {
            return { nextQuestionId: target.id, ended: false };
          }
        }
        if (rule.action.type === "skip") {
          // Fall through to default sequential resolution but exclude the
          // skipped question via isQuestionVisible below.
        }
      }
    }
  }

  const currentIndex = currentQuestionId
    ? ordered.findIndex((q) => q.id === currentQuestionId)
    : -1;

  for (let i = currentIndex + 1; i < ordered.length; i++) {
    const candidate = ordered[i];
    if (isQuestionVisible(candidate, schema.logicRules, answers)) {
      return { nextQuestionId: candidate.id, ended: false };
    }
  }

  return { nextQuestionId: null, ended: true };
}

/**
 * A question is hidden if any global "skip" rule targeting it matches, or
 * a global "show" rule targeting it exists and does NOT match (show rules
 * act as a visibility gate when defined for a question).
 */
export function isQuestionVisible(
  question: Question,
  rules: LogicRule[],
  answers: AnswerMap
): boolean {
  const targeting = rules.filter((r) => {
    if (r.action.type === "end") return false;
    return r.action.targetQuestionId === question.id;
  });

  const showRules = targeting.filter((r) => r.action.type === "show");
  const skipRules = targeting.filter((r) => r.action.type === "skip");

  if (skipRules.some((r) => evaluateGroup(r.group, answers))) return false;
  if (showRules.length > 0 && !showRules.some((r) => evaluateGroup(r.group, answers))) {
    return false;
  }
  return true;
}

/** Resolve the previous *visible* question, for the Back button. */
export function resolvePreviousQuestion(
  schema: Pick<FormSchema, "questions" | "logicRules">,
  currentQuestionId: string,
  answers: AnswerMap
): string | null {
  const ordered = [...schema.questions].sort((a, b) => a.position - b.position);
  const currentIndex = ordered.findIndex((q) => q.id === currentQuestionId);
  for (let i = currentIndex - 1; i >= 0; i--) {
    if (isQuestionVisible(ordered[i], schema.logicRules, answers)) {
      return ordered[i].id;
    }
  }
  return null;
}

export function getFirstQuestion(schema: Pick<FormSchema, "questions" | "logicRules">, answers: AnswerMap): Question | null {
  const ordered = [...schema.questions].sort((a, b) => a.position - b.position);
  for (const q of ordered) {
    if (isQuestionVisible(q, schema.logicRules, answers)) return q;
  }
  return null;
}

/** Rough completion percentage for the progress bar (visible questions only). */
export function computeProgress(
  schema: Pick<FormSchema, "questions" | "logicRules">,
  currentQuestionId: string | null,
  answers: AnswerMap
): number {
  const ordered = [...schema.questions]
    .sort((a, b) => a.position - b.position)
    .filter((q) => isQuestionVisible(q, schema.logicRules, answers));
  if (ordered.length === 0) return 100;
  if (!currentQuestionId) return 0;
  const idx = ordered.findIndex((q) => q.id === currentQuestionId);
  if (idx === -1) return 0;
  return Math.round((idx / ordered.length) * 100);
}
