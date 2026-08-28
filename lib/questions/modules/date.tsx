"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DateQuestion } from "@/lib/types";
import type { EditorProps, QuestionModule, RendererProps } from "../types";

function Renderer({ question, value, onChange, disabled, autoFocus }: RendererProps<DateQuestion>) {
  return (
    <Input
      type="date"
      autoFocus={autoFocus}
      disabled={disabled}
      value={typeof value === "string" ? value : ""}
      min={question.minDate}
      max={question.maxDate}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-fit border-0 border-b-2 rounded-none px-0 text-xl shadow-none focus-visible:ring-0"
    />
  );
}

function Editor({ question, onChange }: EditorProps<DateQuestion>) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <Label>Min date</Label>
        <Input type="date" value={question.minDate ?? ""} onChange={(e) => onChange({ ...question, minDate: e.target.value || undefined })} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Max date</Label>
        <Input type="date" value={question.maxDate ?? ""} onChange={(e) => onChange({ ...question, maxDate: e.target.value || undefined })} />
      </div>
    </div>
  );
}

export const dateModule: QuestionModule<DateQuestion> = {
  type: "date",
  label: "Date",
  description: "A calendar date.",
  icon: "Calendar",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    if (q.required && !(typeof value === "string" && value)) return "This field is required.";
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "date",
    title: "New date question",
    required: true,
    position,
  }),
};
