import { PhotoSession } from "@/types";
import { sessionGps } from "./geo";

// Approximate landmark positions for the existing demo posts, not camera GPS.
const DEMO_COORDINATES: Record<string, [number, number]> = {
  "seochon-autumn-walk-2025": [37.5806, 126.9691],
  "jeju-misty-forest-2026": [33.4881, 126.8095],
  "kamakura-coastal-line-2026": [35.3062, 139.5106],
  "seongsu-brick-alley-2026": [37.5425, 127.0567],
  "kyoto-silent-bamboo-2025": [35.017, 135.6717],
  "gangneung-winter-sea-2025": [37.7956, 128.9188],
  "bukchon-snow-roof-2026": [37.5826, 126.9831],
  "han-river-sunset-glow-2026": [37.5284, 126.9348],
  "tokyo-night-neon-2025": [35.6941, 139.7036],
  "samcheong-spring-cherry-2026": [37.584, 126.9818],
  "namhae-terraced-field-2025": [34.7272, 127.8946],
  "nagano-winter-snow-2026": [36.3483, 138.5968],
  "busan-haeundae-wave-2025": [35.1568, 129.1531],
  "danyang-green-river-2025": [36.9986, 128.3433],
  "osaka-dontonbori-light-2025": [34.6687, 135.5013],
  "pohang-space-walk-2026": [36.0612, 129.3975],
  "gyeongju-daereungwon-green-2025": [35.838, 129.2121],
  "incheon-chinatown-red-2025": [37.4752, 126.6172],
  "yeosu-night-sea-2025": [34.7305, 127.7392],
  "hokkaido-biei-tree-2026": [43.6046, 142.455],
  "yangyang-surf-beach-2025": [38.0259, 128.7167],
  "sapporo-tv-tower-2026": [43.061, 141.3564],
};

export function withDemoCoordinates(session: PhotoSession): PhotoSession {
  const coordinates = DEMO_COORDINATES[session.id];
  if (!coordinates || sessionGps(session)) return session;
  return { ...session, gps: { latitude: coordinates[0], longitude: coordinates[1], source: "demo" } };
}
