"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScaleQuestion } from "@/lib/types";
import type { EditorProps, QuestionModule, RendererProps } from "../types";

function Renderer({ question, value, onChange, disabled, accentColor }: RendererProps<ScaleQuestion>) {
  const min = question.min ?? 0;
  const max = question.max ?? 10;
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {nums.map((n) => {
          const active = value === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              style={active ? { backgroundColor: accentColor || undefined, borderColor: accentColor || undefined } : undefined}
              className={`flex h-11 w-11 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-input hover:bg-accent"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      {(question.minLabel || question.maxLabel) && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{question.minLabel}</span>
          <span>{question.maxLabel}</span>
        </div>
      )}
    </div>
  );
}

function Editor({ question, onChange }: EditorProps<ScaleQuestion>) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex flex-col gap-2">
        <Label>Min</Label>
        <Input type="number" value={question.min ?? 0} onChange={(e) => onChange({ ...question, min: Number(e.target.value) })} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Max</Label>
        <Input type="number" value={question.max ?? 10} onChange={(e) => onChange({ ...question, max: Number(e.target.value) })} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Min label</Label>
        <Input value={question.minLabel ?? ""} onChange={(e) => onChange({ ...question, minLabel: e.target.value })} />
      </div>
      <div className="flex flex-col gap-2">
        <Label>Max label</Label>
        <Input value={question.maxLabel ?? ""} onChange={(e) => onChange({ ...question, maxLabel: e.target.value })} />
      </div>
    </div>
  );
}

export const scaleModule: QuestionModule<ScaleQuestion> = {
  type: "scale",
  label: "Opinion scale",
  description: "Numeric scale, e.g. NPS-style 0-10.",
  icon: "SlidersHorizontal",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    if (q.required && typeof value !== "number") return "Please select a value.";
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "scale",
    title: "New scale question",
    required: true,
    position,
    min: 0,
    max: 10,
    minLabel: "Not likely",
    maxLabel: "Very likely",
  }),
};
