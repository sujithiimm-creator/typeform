"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/client";
import { rowToSchema, slugify, type FormRow } from "@/lib/forms/mapper";
import { DEFAULT_THEME, type FormSchema } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/toast";
import { MoreVertical, Plus, Search, Copy, Trash2, Pencil, BarChart3, ExternalLink } from "lucide-react";

type SortKey = "updated_desc" | "updated_asc" | "title_asc" | "title_desc";

const STATUS_VARIANT: Record<FormSchema["status"], "secondary" | "success" | "outline"> = {
  draft: "secondary",
  published: "success",
  closed: "outline",
};

export default function DashboardPage() {
  const [forms, setForms] = useState<FormSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated_desc");
  const router = useRouter();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  async function loadForms() {
    setLoading(true);
    const { data, error } = await supabase.from("forms").select("*").order("updated_at", { ascending: false });
    if (!error && data) setForms((data as FormRow[]).map(rowToSchema));
    setLoading(false);
  }

  useEffect(() => {
    // Fetch-on-mount data loading; loadForms is also reused as an event
    // handler after create/duplicate/delete actions.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadForms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    let list = forms.filter((f) => f.title.toLowerCase().includes(query.toLowerCase()));
    switch (sort) {
      case "updated_asc":
        list = [...list].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
        break;
      case "title_asc":
        list = [...list].sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "title_desc":
        list = [...list].sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        list = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return list;
  }, [forms, query, sort]);

  async function createForm() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const title = "Untitled form";
    const slug = `${slugify(title)}-${nanoid(6)}`;
    const { data, error } = await supabase
      .from("forms")
      .insert({ owner_id: user.id, title, slug, theme: DEFAULT_THEME })
      .select("*")
      .single();
    if (error || !data) {
      toast({ title: "Couldn't create form", description: error?.message, variant: "destructive" });
      return;
    }
    router.push(`/dashboard/forms/${data.id}/build`);
  }

  async function duplicateForm(form: FormSchema) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const title = `${form.title} (copy)`;
    const slug = `${slugify(title)}-${nanoid(6)}`;
    const { error } = await supabase.from("forms").insert({
      owner_id: user.id,
      title,
      slug,
      description: form.description,
      questions: form.questions,
      logic_rules: form.logicRules,
      theme: form.theme,
      status: "draft",
    });
    if (error) {
      toast({ title: "Couldn't duplicate form", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Form duplicated" });
    loadForms();
  }

  async function deleteForm(form: FormSchema) {
    if (!window.confirm(`Delete "${form.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("forms").delete().eq("id", form.id);
    if (error) {
      toast({ title: "Couldn't delete form", description: error.message, variant: "destructive" });
      return;
    }
    setForms((prev) => prev.filter((f) => f.id !== form.id));
    toast({ title: "Form deleted" });
  }

  async function setStatus(form: FormSchema, status: FormSchema["status"]) {
    const { error } = await supabase.from("forms").update({ status }).eq("id", form.id);
    if (error) {
      toast({ title: "Couldn't update status", description: error.message, variant: "destructive" });
      return;
    }
    setForms((prev) => prev.map((f) => (f.id === form.id ? { ...f, status } : f)));
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your forms</h1>
          <p className="text-sm text-muted-foreground">Create, edit and publish forms.</p>
        </div>
        <Button onClick={createForm}>
          <Plus className="h-4 w-4" /> New form
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search forms…" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_desc">Recently updated</SelectItem>
            <SelectItem value="updated_asc">Oldest updated</SelectItem>
            <SelectItem value="title_asc">Title A–Z</SelectItem>
            <SelectItem value="title_desc">Title Z–A</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <p className="text-sm text-muted-foreground">No forms yet.</p>
          <Button onClick={createForm}>
            <Plus className="h-4 w-4" /> Create your first form
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((form) => (
            <Card key={form.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/dashboard/forms/${form.id}/build`} className="font-semibold hover:underline">
                  {form.title}
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}/build`)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}/responses`)}>
                      <BarChart3 className="h-4 w-4" /> Responses
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => duplicateForm(form)}>
                      <Copy className="h-4 w-4" /> Duplicate
                    </DropdownMenuItem>
                    {form.status === "draft" && (
                      <DropdownMenuItem onClick={() => setStatus(form, "published")}>Publish</DropdownMenuItem>
                    )}
                    {form.status === "published" && (
                      <DropdownMenuItem onClick={() => setStatus(form, "closed")}>Close</DropdownMenuItem>
                    )}
                    {form.status === "closed" && (
                      <DropdownMenuItem onClick={() => setStatus(form, "published")}>Reopen</DropdownMenuItem>
                    )}
                    <DropdownMenuItem variant="destructive" onClick={() => deleteForm(form)}>
                      <Trash2 className="h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[form.status]} className="capitalize">
                  {form.status}
                </Badge>
                <span className="text-xs text-muted-foreground">{form.questions.length} questions</span>
              </div>

              <div className="mt-auto flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/forms/${form.id}/build`}>Edit</Link>
                </Button>
                {form.status === "published" && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/f/${form.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" /> View
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
