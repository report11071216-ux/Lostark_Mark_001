
// ─────────────────────────────────────────────
//  api/lostark.ts
//  로스트아크 전투정보실 API 프록시
//  GET /api/lostark?character=캐릭터명&type=profile|equipment|engravings|gems|cards|siblings
// ─────────────────────────────────────────────

const LOSTARK_API_BASE = "https://developer-lostark.game.onstove.com";

const ENDPOINT_MAP: Record<string, (name: string) => string> = {
  profile:    (n) => `/armories/characters/${encodeURIComponent(n)}/profiles`,
  equipment:  (n) => `/armories/characters/${encodeURIComponent(n)}/equipment`,
  engravings: (n) => `/armories/characters/${encodeURIComponent(n)}/engravings`,
  gems:       (n) => `/armories/characters/${encodeURIComponent(n)}/gems`,
  cards:      (n) => `/armories/characters/${encodeURIComponent(n)}/cards`,
  siblings:   (n) => `/characters/${encodeURIComponent(n)}/siblings`,
  // 한 번에 여러 섹션 조회 (profile+equipment+engravings+gems+cards)
  all:        (n) => `/armories/characters/${encodeURIComponent(n)}?filters=profiles%2Cequipment%2Cengravings%2Cgems%2Ccards`,
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
    return res.status(500).json({ ok: false, error: "LOSTARK_API_KEY is not set in environment variables." });
  }

  const character = String(req.query?.character || "").trim();
  const type      = String(req.query?.type || "all").trim();

  if (!character) {
    return res.status(400).json({ ok: false, error: "character query param is required" });
  }

  const pathFn = ENDPOINT_MAP[type];
  if (!pathFn) {
    return res.status(400).json({ ok: false, error: `Unknown type: ${type}. Valid: ${Object.keys(ENDPOINT_MAP).join(", ")}` });
  }

  const url = `${LOSTARK_API_BASE}${pathFn(character)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json",
        "authorization": `bearer ${apiKey}`,
      },
    });

    // 캐릭터 없음 (비공개 or 존재하지 않음)
    if (response.status === 404) {
      return res.status(404).json({ ok: false, error: "캐릭터를 찾을 수 없습니다. 프로필이 비공개이거나 캐릭터명이 다를 수 있어요." });
    }

    // Rate limit
    if (response.status === 429) {
      return res.status(429).json({ ok: false, error: "API 요청 한도 초과. 잠시 후 다시 시도해주세요." });
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return res.status(response.status).json({ ok: false, error: `Lostark API error: ${response.status}`, detail: text });
    }

    const data = await response.json();
    return res.status(200).json({ ok: true, data });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
