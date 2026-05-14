// ═══════════════════════════════════════════════════════════
//  app/api/lostark/route.ts  —  로스트아크 전투정보실 API 프록시
//  Next.js App Router 기준
//
//  환경변수: LOSTARK_API_KEY  (https://developer-lostark.game.onstove.com)
//
//  사용 예시:
//    GET /api/lostark?character=캐릭터명&type=siblings   → 보유 캐릭터 목록
//    GET /api/lostark?character=캐릭터명&type=profile    → 캐릭터 기본 정보
//    GET /api/lostark?character=캐릭터명&type=equipment  → 장착 장비 정보
// ═══════════════════════════════════════════════════════════
import { NextRequest, NextResponse } from "next/server";

const BASE = "https://developer-lostark.game.onstove.com";

// 한국 서버 공통 헤더
const headers = () => ({
  "accept": "application/json",
  "authorization": `bearer ${process.env.LOSTARK_API_KEY ?? ""}`,
});

// ── 캐릭터 정보 타입 (전투정보실 응답) ────────────────────
interface LostArkCharacter {
  ServerName:          string;
  CharacterName:       string;
  CharacterLevel:      number;
  CharacterClassName:  string;
  ItemAvgLevel:        string;
  ItemMaxLevel:        string;
  CharacterImage?:     string;
}

// ── 공통 fetch 래퍼 ───────────────────────────────────────
async function lostarkFetch(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    next: { revalidate: 300 },   // 5분 캐시
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LostArk API ${res.status}: ${text}`);
  }
  return res.json();
}

// ── GET handler ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const character = searchParams.get("character");
  const type      = searchParams.get("type") ?? "siblings";

  if (!character) {
    return NextResponse.json({ ok: false, error: "character 파라미터가 필요합니다." }, { status: 400 });
  }

  if (!process.env.LOSTARK_API_KEY) {
    // API 키 없으면 더미 데이터 반환 (개발 환경)
    return NextResponse.json({ ok: true, data: getDummyCharacters(character), isDummy: true });
  }

  try {
    const encoded = encodeURIComponent(character);

    if (type === "siblings") {
      // 보유 캐릭터 전체 목록
      const data: LostArkCharacter[] = await lostarkFetch(
        `/characters/${encoded}/siblings`
      );
      // 아이템레벨 내림차순 정렬
      const sorted = [...(data ?? [])].sort((a, b) => {
        const al = parseFloat(a.ItemAvgLevel?.replace(/,/g, "") || "0");
        const bl = parseFloat(b.ItemAvgLevel?.replace(/,/g, "") || "0");
        return bl - al;
      });
      return NextResponse.json({ ok: true, data: sorted });
    }

    if (type === "profile") {
      const data = await lostarkFetch(`/armories/characters/${encoded}/profiles`);
      return NextResponse.json({ ok: true, data });
    }

    if (type === "equipment") {
      const data = await lostarkFetch(`/armories/characters/${encoded}/equipment`);
      return NextResponse.json({ ok: true, data });
    }

    if (type === "skills") {
      const data = await lostarkFetch(`/armories/characters/${encoded}/skills`);
      return NextResponse.json({ ok: true, data });
    }

    if (type === "gems") {
      const data = await lostarkFetch(`/armories/characters/${encoded}/gems`);
      return NextResponse.json({ ok: true, data });
    }

    return NextResponse.json({ ok: false, error: "알 수 없는 type" }, { status: 400 });

  } catch (err: any) {
    console.error("[LostArk API]", err.message);
    // 오류 시 더미 반환 (게임은 계속 플레이 가능하도록)
    return NextResponse.json({
      ok: true,
      data: getDummyCharacters(character),
      isDummy: true,
      error: err.message,
    });
  }
}

// ── 더미 캐릭터 (API 없을 때 기본값) ─────────────────────
function getDummyCharacters(mainName: string): LostArkCharacter[] {
  const classes = [
    "버서커", "소서리스", "호크아이", "블레이드", "바드",
    "건슬링어", "창술사", "데빌헌터", "리퍼", "도화가",
  ];
  const levels = [1680, 1660, 1640, 1620, 1600, 1580, 1560, 1540];
  return Array.from({ length: 8 }, (_, i) => ({
    ServerName:         "카제로스",
    CharacterName:      i === 0 ? mainName : `${mainName.slice(0, 2)}${["가","나","다","라","마","바","사"][i] ?? i}`,
    CharacterLevel:     60,
    CharacterClassName: classes[i % classes.length],
    ItemAvgLevel:       levels[i]?.toLocaleString("ko-KR") ?? "1500",
    ItemMaxLevel:       levels[i]?.toLocaleString("ko-KR") ?? "1500",
    CharacterImage:     undefined,
  }));
}
