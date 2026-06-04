"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Config = { model: string; baseUrl: string; temperature: number };

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
        <Input
          id="model"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={defaults.model}
        />
        <p className="text-xs text-muted-foreground">
          Ollama tag, e.g. {defaults.model}. Blank uses the default.
        </p>
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
