import { getOptionalEnv } from "@/lib/env";
import { runOrderSync } from "@/lib/orders";
import { notifyHighValueOrders } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const env = getOptionalEnv();

  if (!env.CRON_SECRET) {
    return true;
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sync = await runOrderSync();
    const notify = await notifyHighValueOrders();

    return Response.json({
      ok: true,
      sync,
      notify,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
