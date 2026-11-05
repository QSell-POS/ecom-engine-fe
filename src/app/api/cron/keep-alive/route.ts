// Vercel Cron hits this every 10 minutes (see vercel.json) so the Render
// backend, which sleeps after 15 idle minutes, stays warm.

// A cold Render start can take close to a minute.
export const maxDuration = 60;

export async function GET() {
  const base = process.env.API_URL?.replace(/\/$/, "");
  const url = process.env.KEEP_ALIVE_URL || (base && `${base}/health`);
  if (!url) return Response.json({ error: "API_URL is not configured" }, { status: 500 });

  const started = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(55_000) });
    const body = { url, status: res.status, ms: Date.now() - started };
    return Response.json(body, { status: res.ok ? 200 : 502 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Request failed";
    return Response.json({ url, error: message, ms: Date.now() - started }, { status: 502 });
  }
}
