import { checkHealth } from "@/lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Always 200 with an { ok } flag so the client banner can read it without
  // treating a degraded engine as a failed request.
  return Response.json(await checkHealth());
}
