"use client";

import { nanoid } from "nanoid";
import { ChevronDown, ChevronUp, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RankingQuestion } from "@/lib/types";
import type { EditorProps, QuestionModule, RendererProps } from "../types";

function Renderer({ question, value, onChange, disabled }: RendererProps<RankingQuestion>) {
  const order = Array.isArray(value) && value.length ? (value as string[]) : question.options.map((o) => o.value);
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-2">
      {order.map((val, idx) => {
        const opt = question.options.find((o) => o.value === val);
        return (
          <div key={val} className="flex items-center gap-3 rounded-lg border border-input px-3 py-2.5">
            <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
              {idx + 1}
            </span>
            <span className="flex-1 text-base">{opt?.label ?? val}</span>
            <div className="flex flex-col">
              <button type="button" disabled={disabled || idx === 0} onClick={() => move(idx, -1)} className="disabled:opacity-30">
                <ChevronUp className="h-4 w-4" />
              </button>
              <button type="button" disabled={disabled || idx === order.length - 1} onClick={() => move(idx, 1)} className="disabled:opacity-30">
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Editor({ question, onChange }: EditorProps<RankingQuestion>) {
  const options = question.options ?? [];
  const update = (id: string, label: string) =>
    onChange({ ...question, options: options.map((o) => (o.id === id ? { ...o, label, value: label } : o)) });
  const add = () => onChange({ ...question, options: [...options, { id: nanoid(8), label: "", value: "" }] });
  const remove = (id: string) => onChange({ ...question, options: options.filter((o) => o.id !== id) });

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Items to rank</p>
      {options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2">
          <Input value={opt.label} placeholder="Item label" onChange={(e) => update(opt.id, e.target.value)} />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(opt.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add} className="mt-1 w-fit">
        <Plus className="h-4 w-4" /> Add item
      </Button>
    </div>
  );
}

export const rankingModule: QuestionModule<RankingQuestion> = {
  type: "ranking",
  label: "Ranking",
  description: "Order items by preference.",
  icon: "ArrowUpDown",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    if (q.required && !(Array.isArray(value) && value.length === q.options.length)) return "Please rank all items.";
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "ranking",
    title: "New ranking question",
    required: true,
    position,
    options: [
      { id: nanoid(8), label: "Item 1", value: "Item 1" },
      { id: nanoid(8), label: "Item 2", value: "Item 2" },
      { id: nanoid(8), label: "Item 3", value: "Item 3" },
    ],
  }),
};
