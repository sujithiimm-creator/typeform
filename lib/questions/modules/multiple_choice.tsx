"use client";

import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { MultipleChoiceQuestion } from "@/lib/types";
import type { EditorProps, QuestionModule, RendererProps } from "../types";

function Renderer({ question, value, onChange, disabled, accentColor }: RendererProps<MultipleChoiceQuestion>) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
    else onChange([...selected, val]);
  };
  return (
    <div className="flex flex-col gap-2">
      {question.options.map((opt, i) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(opt.value)}
            style={active && accentColor ? { borderColor: accentColor, backgroundColor: `${accentColor}14` } : undefined}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors hover:bg-accent ${
              active ? "border-primary bg-accent" : "border-input"
            }`}
          >
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${active ? "border-primary bg-primary text-primary-foreground" : "border-current"}`}>
              {active ? "✓" : String.fromCharCode(65 + i)}
            </span>
            {opt.label || "Untitled option"}
          </button>
        );
      })}
    </div>
  );
}

function Editor({ question, onChange }: EditorProps<MultipleChoiceQuestion>) {
  const options = question.options ?? [];
  const update = (id: string, label: string) =>
    onChange({ ...question, options: options.map((o) => (o.id === id ? { ...o, label, value: label } : o)) });
  const add = () =>
    onChange({ ...question, options: [...options, { id: nanoid(8), label: "", value: "" }] });
  const remove = (id: string) => onChange({ ...question, options: options.filter((o) => o.id !== id) });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Options</p>
      {options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2">
          <Input value={opt.label} placeholder="Option label" onChange={(e) => update(opt.id, e.target.value)} />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(opt.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="mt-1 w-fit">
        <Plus className="h-4 w-4" /> Add option
      </Button>
    </div>
  );
}

export const multipleChoiceModule: QuestionModule<MultipleChoiceQuestion> = {
  type: "multiple_choice",
  label: "Multiple choice",
  description: "Pick one or more options.",
  icon: "ListChecks",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    const arr = Array.isArray(value) ? value : [];
    if (q.required && arr.length === 0) return "Please choose at least one option.";
    if (q.minSelections && arr.length < q.minSelections) return `Please choose at least ${q.minSelections} options.`;
    if (q.maxSelections && arr.length > q.maxSelections) return `Please choose at most ${q.maxSelections} options.`;
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "multiple_choice",
    title: "New multiple choice question",
    required: true,
    position,
    options: [
      { id: nanoid(8), label: "Option 1", value: "Option 1" },
      { id: nanoid(8), label: "Option 2", value: "Option 2" },
    ],
  }),
};
