"use client";

import { nanoid } from "nanoid";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LogicAction, LogicCondition, LogicOperator, LogicRule, Question } from "@/lib/types";

const OPERATORS: { value: LogicOperator; label: string }[] = [
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "does not equal" },
  { value: "contains", label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "greater_than", label: "is greater than" },
  { value: "less_than", label: "is less than" },
  { value: "is_empty", label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
];

function emptyGroup() {
  return { combinator: "AND" as const, conditions: [] as LogicCondition[] };
}

export function LogicBuilder({
  questions,
  rules,
  onChange,
}: {
  questions: Question[];
  rules: LogicRule[];
  onChange: (rules: LogicRule[]) => void;
}) {
  const ordered = [...questions].sort((a, b) => a.position - b.position);

  function addRule() {
    const rule: LogicRule = {
      id: nanoid(8),
      sourceQuestionId: ordered[0]?.id ?? null,
      group: emptyGroup(),
      action: { type: "show", targetQuestionId: ordered[1]?.id ?? ordered[0]?.id ?? "" },
      priority: rules.length,
    };
    onChange([...rules, rule]);
  }

  function updateRule(id: string, patch: Partial<LogicRule>) {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRule(id: string) {
    onChange(rules.filter((r) => r.id !== id));
  }

  if (ordered.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">Add at least two questions before creating logic rules.</p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Rules run after a respondent answers the source question. When the conditions match, the action applies.
      </p>
      {rules.map((rule) => (
        <RuleEditor
          key={rule.id}
          rule={rule}
          questions={ordered}
          onChange={(patch) => updateRule(rule.id, patch)}
          onRemove={() => removeRule(rule.id)}
        />
      ))}
      <Button variant="outline" size="sm" onClick={addRule} className="w-fit">
        <Plus className="h-4 w-4" /> Add rule
      </Button>
    </div>
  );
}

function RuleEditor({
  rule,
  questions,
  onChange,
  onRemove,
}: {
  rule: LogicRule;
  questions: Question[];
  onChange: (patch: Partial<LogicRule>) => void;
  onRemove: () => void;
}) {
  const group = rule.group;

  function addCondition() {
    const cond: LogicCondition = { id: nanoid(8), questionId: questions[0]?.id ?? "", operator: "equals", value: "" };
    onChange({ group: { ...group, conditions: [...group.conditions, cond] } });
  }
  function updateCondition(id: string, patch: Partial<LogicCondition>) {
    onChange({ group: { ...group, conditions: group.conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)) } });
  }
  function removeCondition(id: string) {
    onChange({ group: { ...group, conditions: group.conditions.filter((c) => c.id !== id) } });
  }

  const action = rule.action;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">After</span>
          <Select value={rule.sourceQuestionId ?? ""} onValueChange={(v) => onChange({ sourceQuestionId: v })}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select question" />
            </SelectTrigger>
            <SelectContent>
              {questions.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.title || "Untitled question"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-col gap-2 rounded-md bg-secondary/50 p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Match</span>
          <Select value={group.combinator} onValueChange={(v) => onChange({ group: { ...group, combinator: v as "AND" | "OR" } })}>
            <SelectTrigger className="h-7 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">ALL</SelectItem>
              <SelectItem value="OR">ANY</SelectItem>
            </SelectContent>
          </Select>
          <span>of the following conditions:</span>
        </div>

        {group.conditions.map((cond) => (
          <div key={cond.id} className="flex flex-wrap items-center gap-2">
            <Select value={cond.questionId} onValueChange={(v) => updateCondition(cond.id, { questionId: v })}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Question" />
              </SelectTrigger>
              <SelectContent>
                {questions.map((q) => (
                  <SelectItem key={q.id} value={q.id}>
                    {q.title || "Untitled question"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={cond.operator} onValueChange={(v) => updateCondition(cond.id, { operator: v as LogicOperator })}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cond.operator !== "is_empty" && cond.operator !== "is_not_empty" && (
              <Input
                className="w-32"
                value={String(cond.value ?? "")}
                onChange={(e) => updateCondition(cond.id, { value: e.target.value })}
                placeholder="Value"
              />
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeCondition(cond.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addCondition} className="w-fit">
          <Plus className="h-3.5 w-3.5" /> Add condition
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Then</span>
        <Select
          value={action.type}
          onValueChange={(v) => {
            const type = v as LogicAction["type"];
            if (type === "end") onChange({ action: { type: "end" } });
            else onChange({ action: { type, targetQuestionId: "targetQuestionId" in action ? action.targetQuestionId : questions[0]?.id ?? "" } });
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="show">show</SelectItem>
            <SelectItem value="skip">skip</SelectItem>
            <SelectItem value="jump">jump to</SelectItem>
            <SelectItem value="end">end form</SelectItem>
          </SelectContent>
        </Select>
        {action.type !== "end" && (
          <Select value={action.targetQuestionId} onValueChange={(v) => onChange({ action: { type: action.type, targetQuestionId: v } })}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Target question" />
            </SelectTrigger>
            <SelectContent>
              {questions.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {q.title || "Untitled question"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </Card>
  );
}
