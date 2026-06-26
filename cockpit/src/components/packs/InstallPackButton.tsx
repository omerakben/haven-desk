"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

/**
 * Installs a pack by slug through POST /api/packs/install, then refreshes the
 * server component so the "installed" state updates. Install is idempotent, so
 * the button stays usable to refresh pack content (labelled "Reinstall").
 */
export function InstallPackButton({
  slug,
  installed,
  disabled,
}: {
  slug: string;
  installed: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function install() {
    setBusy(true);
    try {
      const res = await fetch("/api/packs/install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        installed?: { templates: number; facts: number; tasks: number };
      };
      if (!res.ok || !data.installed) {
        toast.error(data.error ?? "Install failed");
        return;
      }
      const c = data.installed;
      toast.success(`Installed ${c.templates} templates, ${c.facts} facts, ${c.tasks} tasks`);
      router.refresh();
    } catch {
      toast.error("Install failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      onClick={install}
      disabled={busy || disabled}
      variant={installed ? "outline" : "default"}
      size="sm"
    >
      {busy ? "Installing…" : installed ? "Reinstall" : "Install"}
    </Button>
  );
}
