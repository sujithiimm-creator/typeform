"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LongTextQuestion } from "@/lib/types";
import type { EditorProps, QuestionModule, RendererProps } from "../types";

function Renderer({ question, value, onChange, disabled, autoFocus }: RendererProps<LongTextQuestion>) {
  return (
    <Textarea
      autoFocus={autoFocus}
      disabled={disabled}
      value={typeof value === "string" ? value : ""}
      placeholder={question.placeholder ?? "Type your answer here"}
      maxLength={question.maxLength}
      rows={4}
      onChange={(e) => onChange(e.target.value)}
      className="border-0 border-b-2 rounded-none px-0 text-xl shadow-none focus-visible:ring-0"
    />
  );
}

function Editor({ question, onChange }: EditorProps<LongTextQuestion>) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Placeholder</Label>
      <Input value={question.placeholder ?? ""} onChange={(e) => onChange({ ...question, placeholder: e.target.value })} />
      <Label>Max length</Label>
      <Input
        type="number"
        value={question.maxLength ?? ""}
        onChange={(e) => onChange({ ...question, maxLength: e.target.value ? Number(e.target.value) : undefined })}
      />
    </div>
  );
}

export const longTextModule: QuestionModule<LongTextQuestion> = {
  type: "long_text",
  label: "Long text",
  description: "A multi-line text answer.",
  icon: "AlignLeft",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    if (q.required && !(typeof value === "string" && value.trim())) return "This field is required.";
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "long_text",
    title: "New long text question",
    required: true,
    position,
  }),
};
