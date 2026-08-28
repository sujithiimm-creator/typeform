import type { CompletionStatus, FormResponse, Question } from "@/lib/types";

export function completionRate(responses: FormResponse[]): number {
  if (responses.length === 0) return 0;
  const completed = responses.filter((r) => r.completionStatus === "completed").length;
  return Math.round((completed / responses.length) * 100);
}

export function averageCompletionTimeSeconds(responses: FormResponse[]): number | null {
  const durations = responses
    .filter((r) => r.completionStatus === "completed" && r.completedAt)
    .map((r) => (new Date(r.completedAt!).getTime() - new Date(r.startedAt).getTime()) / 1000)
    .filter((d) => d >= 0 && Number.isFinite(d));
  if (durations.length === 0) return null;
  return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
}

export function statusCounts(responses: FormResponse[]): Record<CompletionStatus, number> {
  const counts: Record<CompletionStatus, number> = { in_progress: 0, completed: 0, abandoned: 0 };
  for (const r of responses) counts[r.completionStatus]++;
  return counts;
}

export interface QuestionDistributionBucket {
  label: string;
  count: number;
}

/** Answer-frequency distribution for choice-like question types; null for free text/number. */
export function questionDistribution(question: Question, responses: FormResponse[]): QuestionDistributionBucket[] | null {
  const answers = responses.flatMap((r) => r.answers.filter((a) => a.questionId === question.id));
  if (answers.length === 0) return [];

  switch (question.type) {
    case "yes_no": {
      const counts: Record<string, number> = { yes: 0, no: 0 };
      for (const a of answers) if (typeof a.value === "string" && a.value in counts) counts[a.value]++;
      return Object.entries(counts).map(([label, count]) => ({ label, count }));
    }
    case "single_choice": {
      const counts = new Map<string, number>();
      for (const opt of question.options) counts.set(opt.label, 0);
      for (const a of answers) {
        const opt = question.options.find((o) => o.value === a.value);
        const label = opt?.label ?? String(a.value);
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
    }
    case "multiple_choice": {
      const counts = new Map<string, number>();
      for (const opt of question.options) counts.set(opt.label, 0);
      for (const a of answers) {
        const values = Array.isArray(a.value) ? a.value : [];
        for (const v of values) {
          const opt = question.options.find((o) => o.value === v);
          const label = opt?.label ?? String(v);
          counts.set(label, (counts.get(label) ?? 0) + 1);
        }
      }
      return Array.from(counts.entries()).map(([label, count]) => ({ label, count }));
    }
    case "rating": {
      const counts = new Map<number, number>();
      for (let i = 1; i <= question.max; i++) counts.set(i, 0);
      for (const a of answers) if (typeof a.value === "number") counts.set(a.value, (counts.get(a.value) ?? 0) + 1);
      return Array.from(counts.entries()).map(([label, count]) => ({ label: String(label), count }));
    }
    case "scale": {
      const counts = new Map<number, number>();
      for (let i = question.min; i <= question.max; i++) counts.set(i, 0);
      for (const a of answers) if (typeof a.value === "number") counts.set(a.value, (counts.get(a.value) ?? 0) + 1);
      return Array.from(counts.entries()).map(([label, count]) => ({ label: String(label), count }));
    }
    default:
      return null;
  }
}

export interface DropOffBucket {
  questionId: string;
  questionTitle: string;
  reachedCount: number;
  dropOffCount: number;
}

/**
 * For each question in order, how many responses reached it (answered it or
 * a later one) vs. how many stalled there (lastQuestionId points here and
 * the response never completed).
 */
export function dropOffAnalysis(questions: Question[], responses: FormResponse[]): DropOffBucket[] {
  const ordered = [...questions].sort((a, b) => a.position - b.position);
  return ordered.map((q) => {
    const reachedCount = responses.filter((r) => {
      const idx = ordered.findIndex((x) => x.id === q.id);
      const lastIdx = r.lastQuestionId ? ordered.findIndex((x) => x.id === r.lastQuestionId) : -1;
      return lastIdx >= idx || r.answers.some((a) => a.questionId === q.id);
    }).length;
    const dropOffCount = responses.filter(
      (r) => r.completionStatus !== "completed" && r.lastQuestionId === q.id
    ).length;
    return { questionId: q.id, questionTitle: q.title, reachedCount, dropOffCount };
  });
}
