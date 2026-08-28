import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseNotConfigured } from "@/components/supabase-not-configured";
import { rowToSchema, type FormRow } from "@/lib/forms/mapper";
import { RespondentForm } from "@/components/respondent/RespondentForm";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  if (!isSupabaseConfigured()) return <SupabaseNotConfigured />;

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
