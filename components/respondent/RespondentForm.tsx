"use client";

import { useEffect, useRef } from "react";
import type { AnswerValue, FormSchema } from "@/lib/types";
import { useRespondent } from "@/lib/respondent/useRespondent";
import { getQuestionModule } from "@/lib/questions/registry";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BUTTON_RADIUS: Record<string, string> = {
  rounded: "rounded-md",
  square: "rounded-none",
  pill: "rounded-full",
};

export function RespondentForm({ schema, preview = false }: { schema: FormSchema; preview?: boolean }) {
  const { stage, currentQuestion, answers, error, progress, canGoBack, setAnswer, begin, goNext, goBack } =
    useRespondent({ schema, preview });
  const { theme } = schema;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isTyping = tag === "TEXTAREA" || tag === "INPUT";
      if (e.key === "Enter" && !e.shiftKey && !isTyping) {
        e.preventDefault();
        if (stage === "welcome") begin();
        else if (stage === "question") goNext();
      }
      if (e.key === "ArrowUp" && stage === "question" && !isTyping) {
        e.preventDefault();
        goBack();
      }
      if (e.key === "ArrowDown" && stage === "question" && !isTyping) {
        e.preventDefault();
        goNext();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [stage, begin, goNext, goBack]);

  const radius = BUTTON_RADIUS[theme.buttonStyle] ?? "rounded-md";

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-dvh w-full flex-col"
      style={{ backgroundColor: theme.backgroundColor, color: theme.textColor, fontFamily: theme.fontFamily }}
    >
      {stage === "question" && (
        <div className="fixed left-0 right-0 top-0 z-10">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>
      )}

      {theme.logoUrl && (
        <div className="p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={theme.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
        </div>
      )}

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">
          {stage === "welcome" && (
            <div className="flex flex-col items-start gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h1 className="text-3xl font-bold sm:text-4xl">{theme.welcomeScreen.title || schema.title}</h1>
              {theme.welcomeScreen.description && (
                <p className="text-lg opacity-80">{theme.welcomeScreen.description}</p>
              )}
              <Button
                size="lg"
                className={cn("px-8", radius)}
                style={{ backgroundColor: theme.accentColor, borderColor: theme.accentColor }}
                onClick={() => begin()}
              >
                {theme.welcomeScreen.buttonLabel || "Start"} <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs opacity-50">Press Enter ↵</p>
            </div>
          )}

          {stage === "question" && currentQuestion && (
            <QuestionScreen
              key={currentQuestion.id}
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={(v) => setAnswer(currentQuestion.id, v)}
              onSubmit={goNext}
              error={error}
              accentColor={theme.accentColor}
              radius={radius}
              canGoBack={canGoBack}
              onBack={goBack}
              onNext={goNext}
            />
          )}

          {stage === "complete" && (
            <div className="flex flex-col items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h1 className="text-3xl font-bold sm:text-4xl">{theme.completionScreen.title}</h1>
              {theme.completionScreen.description && (
                <p className="text-lg opacity-80">{theme.completionScreen.description}</p>
              )}
              {preview && (
                <p className="rounded-md bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                  Preview mode — no response was recorded.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuestionScreen({
  question,
  value,
  onChange,
  error,
  accentColor,
  radius,
  canGoBack,
  onBack,
  onNext,
}: {
  question: NonNullable<ReturnType<typeof useRespondent>["currentQuestion"]>;
  value: unknown;
  onChange: (v: AnswerValue) => void;
  onSubmit: () => void;
  error: string | null;
  accentColor: string;
  radius: string;
  canGoBack: boolean;
  onBack: () => void;
  onNext: () => void;
}) {
  const mod = getQuestionModule(question.type);
  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        {question.required && mod.isQuestion && (
          <span className="mb-2 inline-block text-xs font-medium uppercase tracking-wide opacity-50">Required</span>
        )}
        <h2 className="text-2xl font-semibold sm:text-3xl">{question.title}</h2>
        {question.description && <p className="mt-2 text-base opacity-70">{question.description}</p>}
      </div>

      <mod.Renderer question={question as never} value={value as never} onChange={onChange} onSubmit={onNext} accentColor={accentColor} autoFocus />

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="mt-2 flex items-center gap-3">
        {mod.isQuestion && (
          <Button className={radius} style={{ backgroundColor: accentColor, borderColor: accentColor }} onClick={onNext}>
            OK <ArrowRight className="h-4 w-4" />
          </Button>
        )}
        {canGoBack && (
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Previous question">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
