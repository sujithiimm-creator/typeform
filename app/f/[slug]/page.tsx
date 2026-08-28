import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { rowToSchema, type FormRow } from "@/lib/forms/mapper";
import { RespondentForm } from "@/components/respondent/RespondentForm";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) notFound();

  const schema = rowToSchema(data as FormRow);
  return <RespondentForm schema={schema} />;
}
