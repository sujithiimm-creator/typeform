"use client";

import { useRef, useState } from "react";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ThemeConfig } from "@/lib/types";
import { Upload } from "lucide-react";

const FONTS = ["Inter, system-ui, sans-serif", "Georgia, serif", "'Courier New', monospace", "'Trebuchet MS', sans-serif"];

export function ThemePanel({ theme, onChange }: { theme: ThemeConfig; onChange: (t: ThemeConfig) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    const supabase = createClient();
    const path = `logos/${nanoid(12)}-${file.name}`;
    const { error } = await supabase.storage.from("form-assets").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("form-assets").getPublicUrl(path);
      onChange({ ...theme, logoUrl: data.publicUrl });
    }
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Colors</h3>
        <ColorField label="Background" value={theme.backgroundColor} onChange={(v) => onChange({ ...theme, backgroundColor: v })} />
        <ColorField label="Accent" value={theme.accentColor} onChange={(v) => onChange({ ...theme, accentColor: v })} />
        <ColorField label="Text" value={theme.textColor} onChange={(v) => onChange({ ...theme, textColor: v })} />
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Typography &amp; buttons</h3>
        <Label>Font</Label>
        <Select value={theme.fontFamily} onValueChange={(v) => onChange({ ...theme, fontFamily: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FONTS.map((f) => (
              <SelectItem key={f} value={f}>
                {f.split(",")[0].replace(/'/g, "")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Label>Button style</Label>
        <Select value={theme.buttonStyle} onValueChange={(v) => onChange({ ...theme, buttonStyle: v as ThemeConfig["buttonStyle"] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rounded">Rounded</SelectItem>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="pill">Pill</SelectItem>
          </SelectContent>
        </Select>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Logo</h3>
        {theme.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={theme.logoUrl} alt="Logo preview" className="h-10 w-auto object-contain" />
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
        <Button type="button" variant="outline" size="sm" className="w-fit" disabled={uploading} onClick={() => fileInput.current?.click()}>
          <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload logo"}
        </Button>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Welcome screen</h3>
          <Switch
            checked={theme.welcomeScreen.enabled}
            onCheckedChange={(checked) => onChange({ ...theme, welcomeScreen: { ...theme.welcomeScreen, enabled: checked } })}
          />
        </div>
        {theme.welcomeScreen.enabled && (
          <>
            <Label>Title</Label>
            <Input value={theme.welcomeScreen.title} onChange={(e) => onChange({ ...theme, welcomeScreen: { ...theme.welcomeScreen, title: e.target.value } })} />
            <Label>Description</Label>
            <Input
              value={theme.welcomeScreen.description ?? ""}
              onChange={(e) => onChange({ ...theme, welcomeScreen: { ...theme.welcomeScreen, description: e.target.value } })}
            />
            <Label>Button label</Label>
            <Input
              value={theme.welcomeScreen.buttonLabel}
              onChange={(e) => onChange({ ...theme, welcomeScreen: { ...theme.welcomeScreen, buttonLabel: e.target.value } })}
            />
          </>
        )}
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Completion screen</h3>
        <Label>Title</Label>
        <Input value={theme.completionScreen.title} onChange={(e) => onChange({ ...theme, completionScreen: { ...theme.completionScreen, title: e.target.value } })} />
        <Label>Description</Label>
        <Input
          value={theme.completionScreen.description ?? ""}
          onChange={(e) => onChange({ ...theme, completionScreen: { ...theme.completionScreen, description: e.target.value } })}
        />
        <Label>Redirect URL (optional)</Label>
        <Input
          value={theme.completionScreen.redirectUrl ?? ""}
          onChange={(e) => onChange({ ...theme, completionScreen: { ...theme.completionScreen, redirectUrl: e.target.value } })}
        />
      </section>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="shrink-0">{label}</Label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-8 cursor-pointer rounded border border-input" />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="w-28" />
      </div>
    </div>
  );
}
