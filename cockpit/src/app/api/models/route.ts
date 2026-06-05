import { getEffectiveConfig } from "@/lib/config";
import { isEmbeddingTag } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Strip the trailing /v1 from the OpenAI-compatible base to reach native Ollama. */
function nativeRoot(baseUrl: string) {
  return baseUrl.replace(/\/v1\/?$/, "");
}

export type InstalledModel = {
  name: string;
  sizeBytes: number;
  paramSize: string;
  quant: string;
  embedding: boolean;
};

// Lists models actually pulled in the local Ollama, so the Settings picker can
// offer real choices with sizes. Degrades to an empty list (200) when the
// engine is down — the picker then falls back to free-text entry.
export async function GET() {
  const { baseUrl, model } = await getEffectiveConfig();
  const url = `${nativeRoot(baseUrl)}/api/tags`;
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      return Response.json({ models: [], current: model, error: `status ${res.status}` });
    }
    const data = await res.json();
    const models: InstalledModel[] = ((data?.models ?? []) as Array<Record<string, unknown>>)
      .map((m) => {
        const name = String((m.name ?? m.model ?? "") as string);
        const details = (m.details ?? {}) as Record<string, unknown>;
        return {
          name,
          sizeBytes: typeof m.size === "number" ? m.size : 0,
          paramSize: (details.parameter_size as string) ?? "",
          quant: (details.quantization_level as string) ?? "",
          embedding: isEmbeddingTag(name),
        };
      })
      .filter((m) => m.name)
      .sort((a, b) => a.name.localeCompare(b.name));
    return Response.json({ models, current: model });
  } catch (e) {
    return Response.json({
      models: [],
      current: model,
      error: e instanceof Error ? e.message : "unreachable",
    });
  }
}
