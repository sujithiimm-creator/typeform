"use client";

import { use } from "react";
import Link from "next/link";
import { useForm } from "@/lib/forms/useForm";
import { RespondentForm } from "@/components/respondent/RespondentForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { schema, loading, notFound } = useForm(id);

  if (loading) return <div className="p-10 text-sm text-muted-foreground">Loading preview…</div>;
  if (notFound || !schema) return <div className="p-10 text-sm text-muted-foreground">Form not found.</div>;

  return (
    <div className="relative min-h-dvh">
      <Link href={`/dashboard/forms/${id}/build`} className="fixed left-4 top-4 z-20">
        <Button size="sm" variant="secondary">
          <ArrowLeft className="h-4 w-4" /> Back to builder
        </Button>
      </Link>
      <RespondentForm schema={schema} preview />
    </div>
  );
}
