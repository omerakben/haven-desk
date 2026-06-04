import { prisma } from "@/lib/db";
import { getEffectiveConfig } from "@/lib/config";
import { checkHealth } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [config, health] = await Promise.all([getEffectiveConfig(), checkHealth()]);
  const s = await prisma.settings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  return Response.json({ config, health, hasOwuiKey: !!s?.owuiApiKey });
}

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    model?: string;
    baseUrl?: string;
    temperature?: number | string;
    theme?: string;
    owuiApiKey?: string;
  };

  const norm = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const temp =
    body.temperature === "" || body.temperature === null || body.temperature === undefined
      ? null
      : Number(body.temperature);

  if (temp !== null && (Number.isNaN(temp) || temp < 0 || temp > 2)) {
    return Response.json({ error: "Temperature must be between 0 and 2." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  // Only touch engine config when those fields are present (the OWUI key form omits them).
  if ("model" in body) data.model = norm(body.model);
  if ("baseUrl" in body) data.baseUrl = norm(body.baseUrl);
  if ("temperature" in body) data.temperature = temp;
  if (typeof body.theme === "string" && body.theme) data.theme = body.theme;
  if (typeof body.owuiApiKey === "string") data.owuiApiKey = body.owuiApiKey.trim() || null;

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  const config = await getEffectiveConfig();
  return Response.json({ ok: true, config });
}
