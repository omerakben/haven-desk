import { prisma } from "@/lib/db";
import { getEffectiveConfig } from "@/lib/config";
import { checkHealth } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [config, health] = await Promise.all([getEffectiveConfig(), checkHealth()]);
  return Response.json({ config, health });
}

export async function PUT(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { model, baseUrl, temperature, theme } = body ?? {};

  // Empty string clears an override so it falls back to env/default.
  const norm = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const temp =
    temperature === "" || temperature === null || temperature === undefined
      ? null
      : Number(temperature);

  if (temp !== null && (Number.isNaN(temp) || temp < 0 || temp > 2)) {
    return Response.json({ error: "Temperature must be between 0 and 2." }, { status: 400 });
  }

  const data = {
    model: norm(model),
    baseUrl: norm(baseUrl),
    temperature: temp,
    ...(typeof theme === "string" && theme ? { theme } : {}),
  };

  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: data,
    create: { id: "singleton", ...data },
  });

  const config = await getEffectiveConfig();
  return Response.json({ ok: true, config });
}
