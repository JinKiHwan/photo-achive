import { dailyWeatherSummary } from "@/lib/weather";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("latitude"));
  const longitude = Number(params.get("longitude"));
  const date = params.get("date") || "";
  const timestamp = Date.parse(`${date}T00:00:00Z`);
  const today = Date.parse(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  if (!params.get("latitude") || !params.get("longitude") || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date || date < "1940-01-01" || timestamp > today) {
    return Response.json({ error: "올바른 GPS와 과거 또는 오늘의 촬영 날짜를 설정해 주세요." }, { status: 400 });
  }
  const recent = today - timestamp < 7 * 86400000;
  const url = new URL(recent ? "https://api.open-meteo.com/v1/forecast" : "https://archive-api.open-meteo.com/v1/archive");
  url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), start_date: date,
    end_date: date, daily: "weather_code,temperature_2m_mean", timezone: "auto" }).toString();
  try {
    const response = await fetch(url, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error("Weather provider unavailable");
    const data = await response.json();
    const summary = dailyWeatherSummary(data.daily?.weather_code?.[0], data.daily?.temperature_2m_mean?.[0]);
    if (!summary) return Response.json({ error: "해당 날짜의 날씨 데이터가 아직 없거나 조회되지 않습니다. 직접 입력해 주세요." }, { status: 404 });
    return Response.json({ summary, source: "Open-Meteo", date, timezone: data.timezone, recent });
  } catch {
    return Response.json({ error: "날씨 조회에 실패했습니다. 잠시 후 다시 시도하거나 직접 입력해 주세요." }, { status: 502 });
  }
}
