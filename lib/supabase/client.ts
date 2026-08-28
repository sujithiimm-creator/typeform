"use client";

import { createBrowserClient } from "@supabase/ssr";

// Note: the Supabase JS client's generic Database typing requires a fuller
// shape (Relationships, etc.) than our hand-written database.types.ts
// provides. We keep that file as human-readable row documentation and rely
// on lib/types.ts (FormSchema, Answer, ...) for compile-time safety at the
// application boundary instead of threading it through the client generic.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
