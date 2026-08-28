"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InformationQuestion } from "@/lib/types";
import type { EditorProps, QuestionModule, RendererProps } from "../types";

function Renderer({ question, onSubmit, accentColor }: RendererProps<InformationQuestion>) {
  return (
    <div className="flex flex-col gap-4">
      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={question.imageUrl} alt="" className="max-h-64 w-full rounded-lg object-cover" />
      )}
      <Button
        type="button"
        size="lg"
        className="w-fit"
        style={accentColor ? { backgroundColor: accentColor, borderColor: accentColor } : undefined}
        onClick={() => onSubmit?.()}
      >
        {question.buttonLabel || "Continue"}
      </Button>
    </div>
  );
}

function Editor({ question, onChange }: EditorProps<InformationQuestion>) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Button label</Label>
      <Input value={question.buttonLabel ?? ""} placeholder="Continue" onChange={(e) => onChange({ ...question, buttonLabel: e.target.value })} />
      <Label>Image URL (optional)</Label>
      <Input value={question.imageUrl ?? ""} onChange={(e) => onChange({ ...question, imageUrl: e.target.value })} />
    </div>
  );
}

export const informationModule: QuestionModule<InformationQuestion> = {
  type: "information",
  label: "Statement",
  description: "An informational screen with no input.",
  icon: "Info",
  isQuestion: false,
  Renderer,
  Editor,
  validate: () => null,
  createDefault: (position, id) => ({
    id,
    type: "information",
    title: "New statement",
    required: false,
    position,
    buttonLabel: "Continue",
  }),
};
