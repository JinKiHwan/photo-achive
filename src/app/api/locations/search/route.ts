import { normalizeLocationQuery } from "@/lib/location-search";
import { isValidGps } from "@/lib/geo";

type KakaoPlace = { address_name?: string; place_name?: string; road_address_name?: string; x: string; y: string; road_address?: { address_name: string } | null };

export async function GET(request: Request) {
  const query = normalizeLocationQuery(new URL(request.url).searchParams.get("q") ?? "");
  if (query.length < 2 || query.length > 200) return Response.json({ error: "검색어는 2~200자로 입력해 주세요." }, { status: 400 });
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) return Response.json({ code: "NOT_CONFIGURED" }, { status: 503 });
  try {
    const lookup = async (kind: "address" | "keyword"): Promise<KakaoPlace[]> => {
      const url = new URL(`https://dapi.kakao.com/v2/local/search/${kind}.json`);
      url.searchParams.set("query", query);
      url.searchParams.set("size", "5");
      const response = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(8000), cache: "no-store" });
      if (!response.ok) throw new Error("Search provider unavailable");
      const data = await response.json() as { documents: KakaoPlace[] };
      return data.documents;
    };
    let documents = await lookup("address");
    if (!documents.length) documents = await lookup("keyword");
    const places = documents.filter(place => isValidGps({ latitude: Number(place.y), longitude: Number(place.x) })).map((place, index) => ({
      place_id: index,
      display_name: [place.place_name, place.road_address?.address_name || place.road_address_name || place.address_name].filter(Boolean).join(" · "),
      lat: place.y,
      lon: place.x,
    }));
    return Response.json({ places, provider: "kakao" });
  } catch {
    return Response.json({ code: "PROVIDER_UNAVAILABLE" }, { status: 502 });
  }
}
