// api/discord-events.ts
// Vercel Serverless Function — POST /api/discord-events
// Body: { teams: string[][], waiting: string[], options: { team_size: number, team_count: number }, creator_name: string }

import type { VercelRequest, VercelResponse } from "@vercel/node";

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_EVENTS;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!WEBHOOK_URL) {
    return res.status(500).json({ error: "DISCORD_WEBHOOK_EVENTS가 설정되지 않았습니다." });
  }

  const { teams, waiting, options, creator_name } = req.body as {
    teams: string[][];
    waiting: string[];
    options: { team_size?: number; team_count?: number };
    creator_name?: string;
  };

  if (!teams || !Array.isArray(teams) || teams.length === 0) {
    return res.status(400).json({ error: "유효하지 않은 팀 데이터입니다." });
  }

  // ── Discord Embed 구성 ──────────────────────────────────────
  const TEAM_COLORS = [0x7c3aed, 0xdb2777, 0xf59e0b, 0x10b981, 0x0891b2, 0xe11d48];

  const fields = teams.map((team, i) => ({
    name: `🎮 팀 ${i + 1}  (${team.length}명)`,
    value: team.map((name) => `> ${name}`).join("\n") || "—",
    inline: true,
  }));

  // 3열 grid처럼 보이도록 inline placeholder 삽입
  if (fields.length % 2 === 1 && fields.length > 1) {
    fields.push({ name: "\u200b", value: "\u200b", inline: true });
  }

  if (waiting && waiting.length > 0) {
    fields.push({
      name: "🪑 대기 명단",
      value: waiting.join(", "),
      inline: false,
    });
  }

  const embed = {
    title: "🎲 팀원 뽑기 결과",
    description:
      options?.team_count && options?.team_size
        ? `**${options.team_count}팀** × **${options.team_size}명** 편성`
        : "팀 편성이 완료되었습니다.",
    color: TEAM_COLORS[0],
    fields,
    footer: {
      text: creator_name ? `${creator_name} 님이 뽑기를 실행했습니다.` : "길드 이벤트",
    },
    timestamp: new Date().toISOString(),
  };

  // ── Discord Webhook 전송 ────────────────────────────────────
  try {
    const discordRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!discordRes.ok) {
      const text = await discordRes.text();
      console.error("Discord webhook error:", text);
      return res.status(502).json({ error: "디스코드 전송 실패", detail: text });
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error("Fetch error:", e);
    return res.status(500).json({ error: e?.message || "서버 오류" });
  }
}
