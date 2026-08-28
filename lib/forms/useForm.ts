"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rowToSchema, type FormRow } from "@/lib/forms/mapper";
import type { FormSchema } from "@/lib/types";

export function useForm(formId: string) {
  const [supabase] = useState(() => createClient());
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("forms").select("*").eq("id", formId).maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setSchema(rowToSchema(data as FormRow));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [formId, supabase]);

  const persist = useCallback(
    async (patch: Partial<FormRow>) => {
      setSaving(true);
      await supabase.from("forms").update(patch).eq("id", formId);
      setSaving(false);
    },
    [formId, supabase]
  );

  /** Update local state immediately and debounce the write to Supabase. */
  const update = useCallback(
    (updater: (prev: FormSchema) => FormSchema, debounceMs = 700) => {
      setSchema((prev) => {
        if (!prev) return prev;
        const next = updater(prev);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          persist({
            title: next.title,
            description: next.description ?? null,
            questions: next.questions as unknown as FormRow["questions"],
            logic_rules: next.logicRules as unknown as FormRow["logic_rules"],
            theme: next.theme as unknown as FormRow["theme"],
          });
        }, debounceMs);
        return next;
      });
    },
    [persist]
  );

  /** Immediate write, bypassing debounce (status changes, etc). */
  const updateImmediate = useCallback(
    async (patch: Partial<FormRow>, localPatch?: Partial<FormSchema>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      setSchema((prev) => (prev ? { ...prev, ...(localPatch ?? {}) } : prev));
      await persist(patch);
    },
    [persist]
  );

  return { schema, loading, saving, notFound, update, updateImmediate, setSchema };
}
