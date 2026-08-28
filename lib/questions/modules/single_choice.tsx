"use client";

import { nanoid } from "nanoid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { SingleChoiceQuestion } from "@/lib/types";
import type { EditorProps, QuestionModule, RendererProps } from "../types";

function Renderer({ question, value, onChange, onSubmit, disabled, accentColor }: RendererProps<SingleChoiceQuestion>) {
  return (
    <div className="flex flex-col gap-2">
      {question.options.map((opt, i) => (
        <button
          key={opt.id}
          type="button"
          disabled={disabled}
          onClick={() => {
            onChange(opt.value);
            onSubmit?.();
          }}
          style={value === opt.value && accentColor ? { borderColor: accentColor, backgroundColor: `${accentColor}14` } : undefined}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors hover:bg-accent ${
            value === opt.value ? "border-primary bg-accent" : "border-input"
          }`}
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-current text-xs font-medium">
            {String.fromCharCode(65 + i)}
          </span>
          {opt.label || "Untitled option"}
        </button>
      ))}
    </div>
  );
}

function Editor({ question, onChange }: EditorProps<SingleChoiceQuestion>) {
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

export const singleChoiceModule: QuestionModule<SingleChoiceQuestion> = {
  type: "single_choice",
  label: "Single choice",
  description: "Pick exactly one option.",
  icon: "CircleDot",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    if (q.required && !value) return "Please choose an option.";
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "single_choice",
    title: "New single choice question",
    required: true,
    position,
    options: [
      { id: nanoid(8), label: "Option 1", value: "Option 1" },
      { id: nanoid(8), label: "Option 2", value: "Option 2" },
    ],
  }),
};
