import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-role";

export async function GET(request: Request) {
  await requireAdmin();
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) redirect("/admin");
  redirect(`/admin/sightings/${id}`);
}
