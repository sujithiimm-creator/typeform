"use client";

import { Input } from "@/components/ui/input";
import type { EmailQuestion } from "@/lib/types";
import type { QuestionModule, RendererProps } from "../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Renderer({ question, value, onChange, disabled, autoFocus }: RendererProps<EmailQuestion>) {
  return (
    <Input
      type="email"
      autoFocus={autoFocus}
      disabled={disabled}
      value={typeof value === "string" ? value : ""}
      placeholder={question.placeholder ?? "name@example.com"}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 border-0 border-b-2 rounded-none px-0 text-xl shadow-none focus-visible:ring-0"
    />
  );
}

function Editor() {
  return <p className="text-sm text-muted-foreground">Answers are validated as email addresses automatically.</p>;
}

export const emailModule: QuestionModule<EmailQuestion> = {
  type: "email",
  label: "Email",
  description: "A validated email address.",
  icon: "Mail",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    const str = typeof value === "string" ? value.trim() : "";
    if (q.required && !str) return "This field is required.";
    if (str && !EMAIL_RE.test(str)) return "Please enter a valid email address.";
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "email",
    title: "New email question",
    required: true,
    position,
  }),
};
