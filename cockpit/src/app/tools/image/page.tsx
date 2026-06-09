"use client";

import { useState, type ChangeEvent } from "react";
import { Upload, Square } from "lucide-react";
import { toast } from "sonner";

import { useAiTool } from "@/hooks/useAiTool";
import { AiOutput } from "@/components/tools/AiOutput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ImagePage() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");

  const { output, status, error, isRunning, run, stop } = useAiTool({
    endpoint: "/api/vision",
    buildBody: () => ({ prompt, image }),
  });

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImage(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function handleRun() {
    if (!image) {
      toast.error("Attach an image first");
      return;
    }
    await run("");
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Image</h1>
      <p className="mt-1 text-muted-foreground">Ask local Gemma about an image. Nothing leaves your machine.</p>

      <div className="mt-6 space-y-4">
        <Button variant="outline" asChild>
          <label className="cursor-pointer">
            <Upload className="mr-1 h-4 w-4" /> {image ? "Change image" : "Upload image"}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        </Button>

        {image && (
          // Local data-URL preview; next/image isn't needed for a transient upload.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Upload preview" className="max-h-64 rounded-md border border-border" />
        )}

        <Textarea
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="What do you want to know about this image? (default: describe it)"
          disabled={isRunning}
        />

        <div className="flex gap-2">
          <Button onClick={handleRun} disabled={isRunning || !image}>
            {isRunning ? "Looking…" : "Ask"}
          </Button>
          {isRunning && (
            <Button variant="ghost" onClick={stop}>
              <Square className="mr-1 h-4 w-4" /> Stop
            </Button>
          )}
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-destructive">⚠ {error}</p>}
      <AiOutput output={output} status={status} label="Answer" />
    </div>
  );
}
