"use client";

import { Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RatingQuestion } from "@/lib/types";
import type { EditorProps, QuestionModule, RendererProps } from "../types";

function Renderer({ question, value, onChange, disabled, accentColor }: RendererProps<RatingQuestion>) {
  const current = typeof value === "number" ? value : 0;
  return (
    <div className="flex gap-1">
      {Array.from({ length: question.max || 5 }).map((_, i) => {
        const filled = i < current;
        return (
          <button
            key={i}
            type="button"
            disabled={disabled}
            aria-label={`Rate ${i + 1}`}
            onClick={() => onChange(i + 1)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className="h-8 w-8"
              style={{ color: accentColor || "currentColor" }}
              fill={filled ? (accentColor || "currentColor") : "none"}
            />
          </button>
        );
      })}
    </div>
  );
}

function Editor({ question, onChange }: EditorProps<RatingQuestion>) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Number of stars</Label>
      <Input
        type="number"
        min={2}
        max={10}
        value={question.max ?? 5}
        onChange={(e) => onChange({ ...question, max: Number(e.target.value) || 5 })}
      />
    </div>
  );
}

export const ratingModule: QuestionModule<RatingQuestion> = {
  type: "rating",
  label: "Rating",
  description: "Star rating scale.",
  icon: "Star",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    if (q.required && !(typeof value === "number" && value > 0)) return "Please provide a rating.";
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "rating",
    title: "New rating question",
    required: true,
    position,
    max: 5,
  }),
};
