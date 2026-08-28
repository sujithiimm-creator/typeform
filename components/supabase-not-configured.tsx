export function SupabaseNotConfigured() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-secondary/30 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold">Supabase isn&apos;t configured yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and{" "}
          <code className="rounded bg-muted px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> in this
          project&apos;s environment variables, then redeploy. See the README for setup steps.
        </p>
      </div>
    </div>
  );
}
