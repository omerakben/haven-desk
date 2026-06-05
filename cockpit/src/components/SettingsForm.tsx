"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MODEL_PRESETS,
  PRESET_BY_TAG,
  formatBytes,
  type ModelPreset,
} from "@/lib/models";

type Config = { model: string; baseUrl: string; temperature: number };
type InstalledModel = {
  name: string;
  sizeBytes: number;
  paramSize: string;
  quant: string;
  embedding: boolean;
};

const CUSTOM = "__custom__";

export function SettingsForm({
  initialConfig,
  defaults,
}: {
  initialConfig: Config;
  defaults: Config;
}) {
  const [model, setModel] = useState(initialConfig.model);
  const [baseUrl, setBaseUrl] = useState(initialConfig.baseUrl);
  const [temperature, setTemperature] = useState(String(initialConfig.temperature));
  const [saving, setSaving] = useState(false);

  const [installed, setInstalled] = useState<InstalledModel[]>([]);
  const [customMode, setCustomMode] = useState(false);

  // What's actually pulled in the local Ollama (sizes, params). Best-effort.
  // If the saved model isn't a known option, drop into custom mode so the user
  // still sees and can edit their tag. State is set in the async callback (not
  // synchronously in the effect body) to avoid cascading-render lint.
  useEffect(() => {
    let active = true;
    fetch("/api/models")
      .then((r) => r.json())
      .then((d: { models?: InstalledModel[] }) => {
        if (!active) return;
        const models = d.models ?? [];
        setInstalled(models);
        const known =
          models.some((m) => !m.embedding && m.name === initialConfig.model) ||
          !!PRESET_BY_TAG[initialConfig.model];
        if (!known && initialConfig.model) setCustomMode(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialConfig.model]);

  const installedChat = useMemo(() => installed.filter((m) => !m.embedding), [installed]);
  const installedNames = useMemo(() => new Set(installed.map((m) => m.name)), [installed]);
  const presetsNotInstalled = useMemo<ModelPreset[]>(
    () => MODEL_PRESETS.filter((p) => !installedNames.has(p.tag)),
    [installedNames]
  );

  const selectValue = customMode ? CUSTOM : model;

  const hint = useMemo(() => {
    const preset = PRESET_BY_TAG[model];
    if (preset) return `${preset.ramHint} RAM · ${preset.note}`;
    const inst = installed.find((m) => m.name === model);
    if (inst) {
      return [inst.paramSize, inst.quant, formatBytes(inst.sizeBytes)]
        .filter(Boolean)
        .join(" · ");
    }
    return "";
  }, [model, installed]);

  function onSelect(v: string) {
    if (v === CUSTOM) {
      setCustomMode(true);
      return;
    }
    setCustomMode(false);
    setModel(v);
  }

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, baseUrl, temperature: Number(temperature) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("Settings saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="model">Model</Label>
        <Select value={selectValue} onValueChange={onSelect}>
          <SelectTrigger id="model">
            <SelectValue placeholder={defaults.model} />
          </SelectTrigger>
          <SelectContent>
            {installedChat.length > 0 && (
              <SelectGroup>
                <SelectLabel>Installed</SelectLabel>
                {installedChat.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name}
                    {m.sizeBytes ? ` — ${formatBytes(m.sizeBytes)}` : ""}
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {presetsNotInstalled.length > 0 && (
              <SelectGroup>
                <SelectLabel>Available to pull</SelectLabel>
                {presetsNotInstalled.map((p) => (
                  <SelectItem key={p.tag} value={p.tag}>
                    {p.tag} — {p.ramHint} (not pulled)
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            <SelectItem value={CUSTOM}>Custom tag…</SelectItem>
          </SelectContent>
        </Select>

        {customMode && (
          <Input
            aria-label="Custom model tag"
            className="mt-2"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={defaults.model}
          />
        )}

        <p className="text-xs text-muted-foreground">
          {hint || `Ollama tag, e.g. ${defaults.model}.`}
        </p>
      </div>

      <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        Running the full Docker stack (Open WebUI)? A 12B model plus the
        containers can nearly fill 48&nbsp;GB of RAM. Switch to a light model
        like <code className="rounded bg-background px-1 py-0.5">gemma4:e4b</code>{" "}
        (~4&nbsp;GB) to keep headroom. Pull missing models with{" "}
        <code className="rounded bg-background px-1 py-0.5">ollama pull &lt;tag&gt;</code>.
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="baseUrl">Ollama base URL</Label>
        <Input
          id="baseUrl"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder={defaults.baseUrl}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="temperature">Temperature</Label>
        <Input
          id="temperature"
          type="number"
          min={0}
          max={2}
          step={0.1}
          className="w-32"
          value={temperature}
          onChange={(e) => setTemperature(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Default {defaults.temperature}. Lower is more deterministic.
        </p>
      </div>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
