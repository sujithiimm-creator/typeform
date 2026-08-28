"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { nanoid } from "nanoid";
import { useForm } from "@/lib/forms/useForm";
import { getQuestionModule } from "@/lib/questions/registry";
import type { Question, QuestionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { QuestionList } from "@/components/builder/QuestionList";
import { AddQuestionMenu } from "@/components/builder/AddQuestionMenu";
import { QuestionEditorPanel } from "@/components/builder/QuestionEditorPanel";
import { LogicBuilder } from "@/components/builder/LogicBuilder";
import { ThemePanel } from "@/components/builder/ThemePanel";
import { ArrowLeft, Eye, Link as LinkIcon, BarChart3 } from "lucide-react";

export default function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { schema, loading, saving, notFound, update, updateImmediate } = useForm(id);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (schema && !activeQuestionId && schema.questions.length > 0) {
      setActiveQuestionId([...schema.questions].sort((a, b) => a.position - b.position)[0].id);
    }
  }, [schema, activeQuestionId]);

  if (loading) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  if (notFound || !schema) return <div className="p-10 text-sm text-muted-foreground">Form not found.</div>;

  const activeQuestion = schema.questions.find((q) => q.id === activeQuestionId) ?? null;

  function addQuestion(type: QuestionType) {
    const mod = getQuestionModule(type);
    const position = schema!.questions.length;
    const q = mod.createDefault(position, nanoid(10));
    update((prev) => ({ ...prev, questions: [...prev.questions, q] }));
    setActiveQuestionId(q.id);
  }

  function updateQuestion(next: Question) {
    update((prev) => ({ ...prev, questions: prev.questions.map((q) => (q.id === next.id ? next : q)) }));
  }

  function duplicateQuestion(qid: string) {
    update((prev) => {
      const source = prev.questions.find((q) => q.id === qid);
      if (!source) return prev;
      const copy: Question = { ...source, id: nanoid(10), title: `${source.title} (copy)` };
      const questions = [...prev.questions];
      const idx = questions.findIndex((q) => q.id === qid);
      questions.splice(idx + 1, 0, copy);
      return { ...prev, questions: questions.map((q, i) => ({ ...q, position: i })) };
    });
  }

  function deleteQuestion(qid: string) {
    update((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== qid).map((q, i) => ({ ...q, position: i })),
      logicRules: prev.logicRules.filter((r) => r.sourceQuestionId !== qid && (r.action.type === "end" || r.action.targetQuestionId !== qid)),
    }));
    if (activeQuestionId === qid) setActiveQuestionId(null);
  }

  async function handlePublish() {
    await updateImmediate({ status: "published" }, { status: "published" });
    toast({ title: "Form published", description: `Live at /f/${schema!.slug}` });
  }

  async function handleUnpublish(status: "draft" | "closed") {
    await updateImmediate({ status }, { status });
  }

  return (
    <div className="flex h-[calc(100dvh-65px)] flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-background px-4 py-3">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <Input
          value={schema.title}
          onChange={(e) => update((prev) => ({ ...prev, title: e.target.value }))}
          className="h-9 w-64 border-transparent bg-transparent font-semibold shadow-none hover:border-input focus-visible:border-input"
        />
        <Badge variant={schema.status === "published" ? "success" : schema.status === "closed" ? "outline" : "secondary"} className="capitalize">
          {schema.status}
        </Badge>
        <span className="text-xs text-muted-foreground">{saving ? "Saving…" : "Saved"}</span>

        <div className="ml-auto flex items-center gap-2">
          {schema.status === "published" && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/f/${schema.slug}`} target="_blank" rel="noreferrer">
                <LinkIcon className="h-4 w-4" /> /f/{schema.slug}
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/forms/${id}/responses`}>
              <BarChart3 className="h-4 w-4" /> Responses
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/forms/${id}/preview`} target="_blank">
              <Eye className="h-4 w-4" /> Preview
            </Link>
          </Button>
          {schema.status !== "published" ? (
            <Button size="sm" onClick={handlePublish}>
              Publish
            </Button>
          ) : (
            <Select value={schema.status} onValueChange={(v) => handleUnpublish(v as "draft" | "closed")}>
              <SelectTrigger className="h-8 w-28 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="closed">Close form</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs defaultValue="build" className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-border px-4 pt-2">
          <TabsList>
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="logic">Logic</TabsTrigger>
            <TabsTrigger value="design">Design</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="build" className="m-0 flex flex-1 overflow-hidden">
          <div className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-r border-border p-3">
            <AddQuestionMenu onAdd={addQuestion} />
            <QuestionList
              questions={schema.questions}
              activeId={activeQuestionId}
              onSelect={setActiveQuestionId}
              onReorder={(qs) => update((prev) => ({ ...prev, questions: qs }))}
              onDuplicate={duplicateQuestion}
              onDelete={deleteQuestion}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {activeQuestion ? (
              <div className="mx-auto max-w-xl">
                <QuestionEditorPanel question={activeQuestion} onChange={updateQuestion} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add a question to get started, or select one to edit it.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logic" className="m-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl">
            <LogicBuilder
              questions={schema.questions}
              rules={schema.logicRules}
              onChange={(rules) => update((prev) => ({ ...prev, logicRules: rules }))}
            />
          </div>
        </TabsContent>

        <TabsContent value="design" className="m-0 flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-xl">
            <ThemePanel theme={schema.theme} onChange={(theme) => update((prev) => ({ ...prev, theme }))} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
