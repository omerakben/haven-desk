import { lintAdr } from "@/lib/adrLint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Deterministic, model-independent MADR lint. No Ollama needed.
export async function POST(req: Request) {
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text || typeof text !== "string" || !text.trim()) {
    return Response.json({ error: "Paste an ADR to lint." }, { status: 400 });
  }
  return Response.json(lintAdr(text));
}
