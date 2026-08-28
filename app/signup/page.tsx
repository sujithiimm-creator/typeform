import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseNotConfigured } from "@/components/supabase-not-configured";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  if (!isSupabaseConfigured()) return <SupabaseNotConfigured />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return <SignupForm />;
}
