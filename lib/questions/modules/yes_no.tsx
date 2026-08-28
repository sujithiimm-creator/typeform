"use client";

import { Button } from "@/components/ui/button";
import type { YesNoQuestion } from "@/lib/types";
import type { QuestionModule } from "../types";

function Renderer({ question, value, onChange, onSubmit, disabled, accentColor }: import("../types").RendererProps<YesNoQuestion>) {
  return (
    <div className="flex gap-4">
      {(["yes", "no"] as const).map((opt) => (
        <Button
          key={opt}
          type="button"
          disabled={disabled}
          variant={value === opt ? "default" : "outline"}
          size="lg"
          style={value === opt && accentColor ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
          className="min-w-28 capitalize"
          onClick={() => {
            onChange(opt);
            onSubmit?.();
          }}
        >
          {opt}
        </Button>
      ))}
    </div>
  );
}

function Editor() {
  return <p className="text-sm text-muted-foreground">No additional settings for this question type.</p>;
}

export const yesNoModule: QuestionModule<YesNoQuestion> = {
  type: "yes_no",
  label: "Yes / No",
  description: "A simple two-option question.",
  icon: "CircleCheck",
  isQuestion: true,
  Renderer,
  Editor,
  validate: (q, value) => {
    if (q.required && (value !== "yes" && value !== "no")) return "Please choose an option.";
    return null;
  },
  createDefault: (position, id) => ({
    id,
    type: "yes_no",
    title: "New yes/no question",
    required: true,
    position,
  }),
};
