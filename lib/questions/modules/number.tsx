"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { NumberQuestion } from "@/lib/types";
import type { EditorProps, QuestionModule, RendererProps } from "../types";

function Renderer({ question, value, onChange, disabled, autoFocus }: RendererProps<NumberQuestion>) {
  return (
    <Input
      type="number"
      autoFocus={autoFocus}
      disabled={disabled}
      value={typeof value === "number" ? value : (value as string) ?? ""}
      placeholder={question.placeholder ?? "0"}
      min={question.min}
      max={question.max}
      onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      className="h-12 border-0 border-b-2 rounded-none px-0 text-xl shadow-none focus-visible:ring-0"
    />
  );
}

function Editor({ question, onChange }: EditorProps<NumberQuestion>) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <Label>Min</Label>
        <Input type="number" value={question.min ?? ""} onChange={(e) => onChange({ ...question, min: e.target.value ? Number(e.target.value) : undefined })} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Max</Label>
        <Input type="number" value={question.max ?? ""} onChange={(e) => onChange({ ...question, max: e.target.value ? Number(e.target.value) : undefined })} />
      </div>
    </div>
  );
}

export const numberModule: QuestionModule<NumberQuestion> = {
  type: "number",
  label: "Number",
  description: "A numeric answer.",
  icon: "Hash",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    if (q.required && !(typeof value === "number" || (typeof value === "string" && value !== ""))) return "This field is required.";
    if (typeof value === "number") {
      if (q.min !== undefined && value < q.min) return `Must be at least ${q.min}.`;
      if (q.max !== undefined && value > q.max) return `Must be at most ${q.max}.`;
    }
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "number",
    title: "New number question",
    required: true,
    position,
  }),
};
