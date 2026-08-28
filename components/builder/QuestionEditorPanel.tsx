"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { Question } from "@/lib/types";
import { getQuestionModule } from "@/lib/questions/registry";

export function QuestionEditorPanel({
  question,
  onChange,
}: {
  question: Question;
  onChange: (q: Question) => void;
}) {
  const mod = getQuestionModule(question.type);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{mod.label}</p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Question title</Label>
        <Textarea
          value={question.title}
          onChange={(e) => onChange({ ...question, title: e.target.value } as Question)}
          rows={2}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Description (optional)</Label>
        <Textarea
          value={question.description ?? ""}
          onChange={(e) => onChange({ ...question, description: e.target.value } as Question)}
          rows={2}
        />
      </div>

      {mod.isQuestion && (
        <div className="flex items-center justify-between">
          <Label htmlFor="required-toggle">Required</Label>
          <Switch
            id="required-toggle"
            checked={question.required}
            onCheckedChange={(checked) => onChange({ ...question, required: checked } as Question)}
          />
        </div>
      )}

      <Separator />

      <mod.Editor question={question as never} onChange={(q) => onChange(q as Question)} />
    </div>
  );
}
