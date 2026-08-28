"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "@/lib/forms/useForm";
import { loadResponses } from "@/lib/forms/loadResponses";
import type { FormResponse } from "@/lib/types";
import {
  averageCompletionTimeSeconds,
  completionRate,
  dropOffAnalysis,
  questionDistribution,
  statusCounts,
} from "@/lib/analytics/compute";
import { exportCsv, exportJson } from "@/lib/export/export";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowLeft, Download, FileJson } from "lucide-react";

export default function ResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { schema, loading: schemaLoading } = useForm(id);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FormResponse | null>(null);

  useEffect(() => {
    loadResponses(id).then((r) => {
      setResponses(r);
      setLoading(false);
    });
  }, [id]);

  if (schemaLoading || loading || !schema) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;

  const rate = completionRate(responses);
  const avgTime = averageCompletionTimeSeconds(responses);
  const counts = statusCounts(responses);
  const dropOff = dropOffAnalysis(schema.questions, responses).filter((d) => d.dropOffCount > 0);
  const ordered = [...schema.questions].sort((a, b) => a.position - b.position).filter((q) => q.type !== "information");

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/dashboard/forms/${id}/build`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{schema.title} — Responses</h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(schema.title, schema.questions, responses)}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportJson(schema.title, schema.questions, responses)}>
            <FileJson className="h-4 w-4" /> Export JSON
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total responses" value={responses.length} />
        <Stat label="Completion rate" value={`${rate}%`} />
        <Stat label="Avg. completion time" value={avgTime !== null ? formatDuration(avgTime) : "—"} />
        <Stat label="In progress" value={counts.in_progress} />
      </div>

      {dropOff.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Drop-off</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {dropOff
              .sort((a, b) => b.dropOffCount - a.dropOffCount)
              .map((d) => (
                <div key={d.questionId} className="flex items-center justify-between text-sm">
                  <span className="truncate">{d.questionTitle}</span>
                  <Badge variant="secondary">{d.dropOffCount} stopped here</Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {ordered.map((q) => {
          const dist = questionDistribution(q, responses);
          if (!dist || dist.length === 0) return null;
          return (
            <Card key={q.id}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">{q.title}</CardTitle>
              </CardHeader>
              <CardContent className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dist} margin={{ left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="var(--color-primary, #4f46e5)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Individual responses</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Started</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 font-medium">Answers</th>
                </tr>
              </thead>
              <tbody>
                {responses.map((r) => (
                  <tr key={r.id} className="cursor-pointer border-b border-border last:border-0 hover:bg-secondary/50" onClick={() => setSelected(r)}>
                    <td className="px-4 py-2">{new Date(r.startedAt).toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <Badge variant={r.completionStatus === "completed" ? "success" : r.completionStatus === "abandoned" ? "outline" : "secondary"} className="capitalize">
                        {r.completionStatus.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">{r.answers.length}</td>
                  </tr>
                ))}
                {responses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                      No responses yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-4 text-lg font-semibold">Response detail</h2>
            <div className="flex flex-col gap-3">
              {ordered.map((q) => {
                const a = selected.answers.find((x) => x.questionId === q.id);
                return (
                  <div key={q.id} className="border-b border-border pb-2">
                    <p className="text-xs font-medium text-muted-foreground">{q.title}</p>
                    <p className="text-sm">{formatAnswer(a?.value)}</p>
                  </div>
                );
              })}
            </div>
            <Button className="mt-4 w-full" variant="outline" onClick={() => setSelected(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatAnswer(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}
