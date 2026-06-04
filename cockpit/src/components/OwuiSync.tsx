"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OwuiSync() {
  const [hasKey, setHasKey] = useState(false);
  const [key, setKey] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (active) setHasKey(!!d.hasOwuiKey);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function save() {
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ owuiApiKey: key }),
    });
    if (!res.ok) {
      toast.error("Failed to save");
      return;
    }
    setHasKey(!!key.trim());
    setKey("");
    toast.success("Open WebUI key saved");
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Open WebUI sync</h2>
      <p className="text-sm text-muted-foreground">
        Paste an Open WebUI API key to enable one-way prompt sync (Prompt Library → Sync to Open
        WebUI). In Open WebUI: Settings → Account → API Keys → create a key.
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="owui-key">
          API key {hasKey && <span className="text-green-600">(set)</span>}
        </Label>
        <div className="flex gap-2">
          <Input
            id="owui-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={hasKey ? "•••••• (paste to replace)" : "sk-…"}
            className="font-mono text-xs"
          />
          <Button onClick={save} disabled={!key.trim()}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
