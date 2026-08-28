/**
 * Core domain types for the form-building platform.
 *
 * Architecture: Form Builder -> Form Schema -> Logic Engine -> Respondent
 * Engine -> Response Storage -> Analytics. Everything below this line is a
 * plain-data description of a form; no UI concerns leak into this file.
 */

// ---------------------------------------------------------------------------
// Question types
// ---------------------------------------------------------------------------

export const QUESTION_TYPES = [
  "yes_no",
  "single_choice",
  "multiple_choice",
  "rating",
  "scale",
  "short_text",
  "long_text",
  "number",
  "email",
  "date",
  "ranking",
  "information",
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuestionOption {
  id: string;
  label: string;
  value: string;
}

interface BaseQuestion {
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  /** Order within the form; the builder keeps this dense (0..n-1). */
  position: number;
}

export interface YesNoQuestion extends BaseQuestion {
  type: "yes_no";
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single_choice";
  options: QuestionOption[];
  randomize?: boolean;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: QuestionOption[];
  randomize?: boolean;
  minSelections?: number;
  maxSelections?: number;
}

export interface RatingQuestion extends BaseQuestion {
  type: "rating";
  /** Number of stars/icons, typically 5 or 10. */
  max: number;
  shape?: "star" | "heart" | "thumb";
}

export interface ScaleQuestion extends BaseQuestion {
  type: "scale";
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface ShortTextQuestion extends BaseQuestion {
  type: "short_text";
  placeholder?: string;
  maxLength?: number;
}

export interface LongTextQuestion extends BaseQuestion {
  type: "long_text";
  placeholder?: string;
  maxLength?: number;
}

export interface NumberQuestion extends BaseQuestion {
  type: "number";
  min?: number;
  max?: number;
  placeholder?: string;
}

export interface EmailQuestion extends BaseQuestion {
  type: "email";
  placeholder?: string;
}

export interface DateQuestion extends BaseQuestion {
  type: "date";
  minDate?: string;
  maxDate?: string;
}

export interface RankingQuestion extends BaseQuestion {
  type: "ranking";
  options: QuestionOption[];
}

export interface InformationQuestion extends BaseQuestion {
  type: "information";
  buttonLabel?: string;
  imageUrl?: string;
}

export type Question =
  | YesNoQuestion
  | SingleChoiceQuestion
  | MultipleChoiceQuestion
  | RatingQuestion
  | ScaleQuestion
  | ShortTextQuestion
  | LongTextQuestion
  | NumberQuestion
  | EmailQuestion
  | DateQuestion
  | RankingQuestion
  | InformationQuestion;

// ---------------------------------------------------------------------------
// Logic engine types
// ---------------------------------------------------------------------------

export type LogicOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "is_empty"
  | "is_not_empty";

export interface LogicCondition {
  id: string;
  questionId: string;
  operator: LogicOperator;
  /** Comparison value; unused for is_empty / is_not_empty. */
  value?: string | number | boolean;
}

export interface LogicConditionGroup {
  /** How conditions within this group combine. */
  combinator: "AND" | "OR";
  conditions: LogicCondition[];
}

export type LogicAction =
  | { type: "show"; targetQuestionId: string }
  | { type: "skip"; targetQuestionId: string }
  | { type: "jump"; targetQuestionId: string }
  | { type: "end" };

export interface LogicRule {
  id: string;
  /** The question this rule is evaluated after answering (empty = global rule, checked every step). */
  sourceQuestionId: string | null;
  group: LogicConditionGroup;
  action: LogicAction;
  /** Lower runs first when multiple rules could match the same source. */
  priority: number;
}

// ---------------------------------------------------------------------------
// Theme / customization
// ---------------------------------------------------------------------------

export interface ThemeConfig {
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  buttonStyle: "rounded" | "square" | "pill";
  logoUrl?: string;
  welcomeScreen: {
    enabled: boolean;
    title: string;
    description?: string;
    buttonLabel: string;
  };
  completionScreen: {
    title: string;
    description?: string;
    redirectUrl?: string;
  };
}

export const DEFAULT_THEME: ThemeConfig = {
  backgroundColor: "#ffffff",
  accentColor: "#4f46e5",
  textColor: "#14151a",
  fontFamily: "Inter, system-ui, sans-serif",
  buttonStyle: "rounded",
  welcomeScreen: {
    enabled: true,
    title: "Welcome",
    description: "This will take about 2 minutes.",
    buttonLabel: "Start",
  },
  completionScreen: {
    title: "Thank you!",
    description: "Your response has been recorded.",
  },
};

// ---------------------------------------------------------------------------
// Form schema
// ---------------------------------------------------------------------------

export type FormStatus = "draft" | "published" | "closed";

export interface FormSchema {
  id: string;
  ownerId: string;
  slug: string;
  title: string;
  description?: string;
  status: FormStatus;
  questions: Question[];
  logicRules: LogicRule[];
  theme: ThemeConfig;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export type CompletionStatus = "in_progress" | "completed" | "abandoned";

export interface Answer {
  questionId: string;
  /** JSON-serializable answer value; shape depends on question type. */
  value: unknown;
}

export interface FormResponse {
  id: string;
  formId: string;
  sessionId: string;
  answers: Answer[];
  startedAt: string;
  completedAt?: string;
  completionStatus: CompletionStatus;
  /** Id of the last question the respondent reached, for drop-off analysis. */
  lastQuestionId?: string;
}

// ---------------------------------------------------------------------------
// Answer-value helpers
// ---------------------------------------------------------------------------

export type AnswerValue = string | number | boolean | string[] | null | undefined;

export function isAnswerEmpty(value: AnswerValue): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
