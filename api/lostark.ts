// ─────────────────────────────────────────────
//  api/lostark.ts  (Vercel Serverless Function)
//  GET /api/lostark?character=캐릭터명&type=profile|equipment|engravings|gems|cards|siblings|all
// ─────────────────────────────────────────────
const LOSTARK_API_BASE = "https://developer-lostark.game.onstove.com";

const ENDPOINT_MAP: Record<string, (name: string) => string> = {
  profile:    (n) => `/armories/characters/${encodeURIComponent(n)}/profiles`,
  equipment:  (n) => `/armories/characters/${encodeURIComponent(n)}/equipment`,
  engravings: (n) => `/armories/characters/${encodeURIComponent(n)}/engravings`,
  gems:       (n) => `/armories/characters/${encodeURIComponent(n)}/gems`,
  cards:      (n) => `/armories/characters/${encodeURIComponent(n)}/cards`,
  siblings:   (n) => `/characters/${encodeURIComponent(n)}/siblings`,

  // ✅ FIX 1: %2C → 쉼표로 변경 (URL 인코딩 문제)
  all: (n) =>
    `/armories/characters/${encodeURIComponent(n)}?filters=profiles,equipment,engravings,gems,cards`,
};

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "GET only" });
  }

  const apiKey = process.env.LOSTARK_API_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ ok: false, error: "LOSTARK_API_KEY is not set in environment variables." });
  }

  const character = String(req.query?.character || "").trim();
  const type      = String(req.query?.type || "all").trim();

  if (!character) {
    return res.status(400).json({ ok: false, error: "character query param is required" });
  }

  const pathFn = ENDPOINT_MAP[type];
  if (!pathFn) {
    return res.status(400).json({
      ok: false,
      error: `Unknown type: ${type}. Valid: ${Object.keys(ENDPOINT_MAP).join(", ")}`,
    });
  }

  const url = `${LOSTARK_API_BASE}${pathFn(character)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        // ✅ FIX 2: 소문자 "authorization" → 대문자 "Authorization"
        "Authorization": `bearer ${apiKey}`,
      },
    });

    if (response.status === 404) {
      return res.status(404).json({
        ok: false,
        error: "캐릭터를 찾을 수 없습니다. 프로필이 비공개이거나 캐릭터명이 다를 수 있어요.",
      });
    }

    if (response.status === 401) {
      // ✅ FIX 3: 인증 오류 처리 추가
      return res.status(401).json({
        ok: false,
        error: "API 키 인증 실패. LOSTARK_API_KEY를 확인해주세요.",
      });
    }

    if (response.status === 429) {
      return res.status(429).json({
        ok: false,
        error: "API 요청 한도 초과. 잠시 후 다시 시도해주세요.",
      });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return res.status(response.status).json({
        ok: false,
        error: `Lostark API error: ${response.status}`,
        detail: text,
      });
    }

    const data = await response.json();

    // ✅ FIX 4: null 반환 시 명확한 에러 처리 (비공개 프로필)
    if (data === null) {
      return res.status(404).json({
        ok: false,
        error: "캐릭터 정보가 없습니다. 전투정보실이 비공개 상태일 수 있어요.",
      });
    }

    return res.status(200).json({ ok: true, data });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
