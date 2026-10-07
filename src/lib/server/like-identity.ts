import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export function normalizeIp(value: string): string | null {
  const ip = value.trim();
  if (isIP(ip) === 4) return ip;
  if (isIP(ip) !== 6 || ip.includes("%")) return null;
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
  // IPv4-mapped IPv6 must share the same vote as its IPv4 representation.
  const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(canonical);
  if (mapped) {
    const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
    return [high >> 8, high & 255, low >> 8, low & 255].join(".");
  }
  return canonical;
}

export function voterKey(ip: string, sessionId: string, secret: string): string {
  if (secret.length < 32) throw new Error("Like secret is not configured");
  return createHmac("sha256", secret).update(`like:v1:${sessionId}:${ip}`).digest("hex");
}

export function requestIp(request: Request): string | null {
  // Only a deployment proxy that overwrites this header is trusted. Never accept
  // arbitrary forwarded headers supplied by the browser or a user-controlled chain.
  const header = process.env.LIKES_TRUSTED_IP_HEADER;
  if (header) return normalizeIp(request.headers.get(header) ?? "");
  const hostname = new URL(request.url).hostname;
  if (process.env.NODE_ENV === "development" && ["localhost", "127.0.0.1", "[::1]"].includes(hostname)) return "127.0.0.1";
  return null;
}
