import { AdrWriter } from "@/components/adr/AdrWriter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function AdrPage() {
  return <AdrWriter />;
}
