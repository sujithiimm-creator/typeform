import type { ComponentType } from "react";
import type { AnswerValue, Question, QuestionType } from "@/lib/types";

export interface RendererProps<Q extends Question = Question> {
  question: Q;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  /** Advance to next question (called by renderers that submit on selection, e.g. yes/no). */
  onSubmit?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  accentColor?: string;
}

export interface EditorProps<Q extends Question = Question> {
  question: Q;
  onChange: (question: Q) => void;
}

export interface QuestionModule<Q extends Question = Question> {
  type: QuestionType;
  label: string;
  description: string;
  icon: string; // lucide icon name, resolved by the builder UI
  isQuestion: boolean; // false for "information" screens
  Renderer: ComponentType<RendererProps<Q>>;
  Editor: ComponentType<EditorProps<Q>>;
  validate: (question: Q, value: AnswerValue) => string | null;
  createDefault: (position: number, id: string) => Q;
}
