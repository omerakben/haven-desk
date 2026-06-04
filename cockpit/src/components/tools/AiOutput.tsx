"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AiToolStatus } from "@/hooks/useAiTool";

/** Shared streamed-output panel: label, copy, and a blinking cursor while streaming. */
export function AiOutput({
  output,
  status,
  label = "Output",
}: {
  output: string;
  status: AiToolStatus;
  label?: string;
}) {
  if (!output && status !== "streaming") return null;

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          disabled={!output}
          onClick={() => {
            navigator.clipboard.writeText(output);
            toast.success("Copied");
          }}
        >
          <Copy className="mr-1 h-4 w-4" /> Copy
        </Button>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap break-words text-sm">
          {output}
          {status === "streaming" && <span className="animate-pulse">▍</span>}
        </pre>
      </CardContent>
    </Card>
  );
}
