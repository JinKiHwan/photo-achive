import { likesDatabase } from "@/lib/server/firebase-admin";
import { requestIp } from "@/lib/server/like-identity";
import { LikeError, readLikes, setLike, validSessionId } from "@/lib/server/likes";

export const runtime = "nodejs";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "private, no-store", "Vary": "Origin" } });
function context(request: Request) {
  const db = likesDatabase();
  const ip = requestIp(request);
  if (!db || !ip) throw new LikeError(503, "좋아요 기능을 준비 중입니다.");
  return { db, ip, secret: process.env.LIKES_IP_SECRET! };
}
function failure(error: unknown) {
  return error instanceof LikeError ? json({ error: error.message }, error.status) : json({ error: "좋아요를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." }, 503);
}
export async function GET(request: Request) {
  try {
    const ids = [...new Set(new URL(request.url).searchParams.get("ids")?.split(",") ?? [])];
    if (!ids.length || ids.length > 60 || !ids.every(validSessionId)) return json({ error: "잘못된 글 목록입니다." }, 400);
    const { db, ip, secret } = context(request);
    return json({ likes: await readLikes(db, ids, ip, secret) });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    // Do not let third-party pages cast votes with the visitor's network identity.
    if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "허용되지 않은 요청입니다." }, 403);
    if (!request.headers.get("content-type")?.startsWith("application/json")) return json({ error: "잘못된 요청입니다." }, 415);
    if (Number(request.headers.get("content-length")) > 1024) return json({ error: "요청이 너무 큽니다." }, 413);
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "잘못된 요청입니다." }, 400);
    let body = "", bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1024) { await reader.cancel(); return json({ error: "요청이 너무 큽니다." }, 413); }
      body += decoder.decode(value, { stream: true });
    }
    let data;
    try { data = JSON.parse(body + decoder.decode()); } catch { return json({ error: "잘못된 요청입니다." }, 400); }
    if (!data || !validSessionId(data.sessionId) || typeof data.liked !== "boolean") return json({ error: "잘못된 요청입니다." }, 400);
    const { db, ip, secret } = context(request);
    return json(await setLike(db, data.sessionId, ip, secret, data.liked));
  } catch (error) { return failure(error); }
}
