export function weatherDescription(code: number): string {
  if (code === 0) return "맑음";
  if (code === 1) return "대체로 맑음";
  if (code === 2) return "구름 많음";
  if (code === 3) return "흐림";
  if ([45, 48].includes(code)) return "안개";
  if ([51, 53, 55, 56, 57].includes(code)) return "이슬비";
  if ([61, 63, 65, 66, 67].includes(code)) return "비";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "눈";
  if ([80, 81, 82].includes(code)) return "소나기";
  if ([95, 96, 99].includes(code)) return "뇌우";
  return "날씨 정보 없음";
}

export function dailyWeatherSummary(code: unknown, temperature: unknown): string | null {
  if (typeof code !== "number" || typeof temperature !== "number" || !Number.isFinite(temperature)) return null;
  const description = weatherDescription(code);
  if (description === "날씨 정보 없음") return null;
  return `${description} · 일평균 ${Math.round(temperature)}°C`;
}
