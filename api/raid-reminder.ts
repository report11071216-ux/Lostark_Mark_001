// ─────────────────────────────────────────────
//  api/raid-reminder.ts
//  개선 사항:
//  1. 알림 embed에 참가자 명단 포함
//  2. 레이드 종료 후 자동 완료 알림
//  3. rate limit 안전 처리 (재시도)
//  4. 부분 성공 처리 (한 건 실패해도 나머지 계속)
// ─────────────────────────────────────────────
//  * 정원 마감 알림은 app.tsx 참가 로직에서
//    /api/discord 로 POST 호출하는 방식을 권장
//    (실시간성이 필요하기 때문)
// ─────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!supabaseUrl) throw new Error("Missing VITE_SUPABASE_URL");
if (!serviceRoleKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
if (!discordWebhookUrl) throw new Error("Missing DISCORD_WEBHOOK_URL");

const supabase = createClient(supabaseUrl, serviceRoleKey);

const MAX_RETRIES = 3;

// ── Discord fetch + rate limit 재시도 ────────────────────
async function discordFetch(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 429 && retries > 0) {
    let retryAfterMs = 1000;
    try {
      const data = await response.clone().json();
      retryAfterMs = (data?.retry_after ?? 1) * 1000;
    } catch {
      // 기본값 유지
    }
    await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
    return discordFetch(url, options, retries - 1);
  }

  return response;
}

// ── 참가자 명단 텍스트 조합 ──────────────────────────────
function buildParticipantText(participants: any[]): string {
  if (!participants || participants.length === 0) return "참가자 없음";

  const dealers = participants.filter((p) => p.position === "딜러");
  const supports = participants.filter((p) => p.position === "서포터");
  const others = participants.filter(
    (p) => p.position !== "딜러" && p.position !== "서포터"
  );

  const lines: string[] = [];

  if (dealers.length > 0) {
    lines.push(`⚔️ 딜러 (${dealers.length}명): ${dealers.map((p) => p.character_name).join(", ")}`);
  }
  if (supports.length > 0) {
    lines.push(`🛡️ 서포터 (${supports.length}명): ${supports.map((p) => p.character_name).join(", ")}`);
  }
  if (others.length > 0) {
    lines.push(`👤 기타 (${others.length}명): ${others.map((p) => p.character_name).join(", ")}`);
  }

  return lines.join("\n");
}

// ── 참가자 조회 ──────────────────────────────────────────
async function fetchParticipants(raidId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from("raid_participants")
    .select("character_name, position, class_name")
    .eq("raid_id", raidId);

  if (error) {
    console.error(`참가자 조회 실패 (raidId: ${raidId}):`, error.message);
    return [];
  }
  return data ?? [];
}

// ── Discord 메시지 전송 (부분 실패 허용) ─────────────────
async function sendDiscordMessage(payload: object): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await discordFetch(discordWebhookUrl!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { ok: false, error: errorText };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown" };
  }
}

// ─────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  try {
    const now = new Date();

    // 시간 범위 계산
    const oneHourFrom = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
    const oneHourTo   = new Date(now.getTime() + 61 * 60 * 1000).toISOString();
    const tenMinFrom  = new Date(now.getTime() +  9 * 60 * 1000).toISOString();
    const tenMinTo    = new Date(now.getTime() + 11 * 60 * 1000).toISOString();

    // 종료 감지: raid_datetime이 현재 기준 0~10분 전이고 아직 completed=false
    const completedFrom = new Date(now.getTime() - 10 * 60 * 1000).toISOString();
    const completedTo   = now.toISOString();

    // ── DB 조회 ─────────────────────────────────────────
    const [
      { data: oneHourRaids, error: oneHourError },
      { data: tenMinRaids,  error: tenMinError  },
      { data: completedRaids, error: completedError },
    ] = await Promise.all([
      supabase
        .from("raid_schedules")
        .select("*")
        .eq("one_hour_reminded", false)
        .not("raid_datetime", "is", null)
        .gte("raid_datetime", oneHourFrom)
        .lt("raid_datetime", oneHourTo),

      supabase
        .from("raid_schedules")
        .select("*")
        .eq("ten_min_reminded", false)
        .not("raid_datetime", "is", null)
        .gte("raid_datetime", tenMinFrom)
        .lt("raid_datetime", tenMinTo),

      supabase
        .from("raid_schedules")
        .select("*")
        .eq("completed", false)
        .not("raid_datetime", "is", null)
        .gte("raid_datetime", completedFrom)
        .lt("raid_datetime", completedTo),
    ]);

    if (oneHourError) return res.status(500).json({ ok: false, step: "one_hour_select", error: oneHourError.message });
    if (tenMinError)  return res.status(500).json({ ok: false, step: "ten_min_select",  error: tenMinError.message  });
    if (completedError) console.error("completed 조회 실패:", completedError.message); // 종료 알림은 치명적이지 않으므로 계속

    const errors: { step: string; raidId: string; error: string }[] = [];
    let oneHourSentCount  = 0;
    let tenMinSentCount   = 0;
    let completedSentCount = 0;

    // ── 1시간 전 알림 ────────────────────────────────────
    for (const raid of oneHourRaids ?? []) {
      const participants = await fetchParticipants(raid.id);
      const participantText = buildParticipantText(participants);
      const raidTime = new Date(raid.raid_datetime).toLocaleString("ko-KR");

      const { ok, error } = await sendDiscordMessage({
        content: "⏰ **레이드 1시간 전**입니다! 준비해주세요.",
        embeds: [
          {
            title: raid.raid_name ?? "레이드 알림",
            color: 0xffcc00,
            fields: [
              { name: "🕐 시작 시간", value: raidTime, inline: true },
              { name: "👥 총 참가자", value: `${participants.length}명`, inline: true },
              { name: "📋 참가자 명단", value: participantText },
            ],
            footer: { text: "1시간 전 알림" },
          },
        ],
      });

      if (!ok) {
        errors.push({ step: "one_hour_discord", raidId: raid.id, error: error ?? "" });
        continue; // 실패해도 다음 레이드 계속
      }

      const { error: updateError } = await supabase
        .from("raid_schedules")
        .update({ one_hour_reminded: true })
        .eq("id", raid.id);

      if (updateError) {
        errors.push({ step: "one_hour_update", raidId: raid.id, error: updateError.message });
        continue;
      }

      oneHourSentCount++;
    }

    // ── 10분 전 알림 ─────────────────────────────────────
    for (const raid of tenMinRaids ?? []) {
      const participants = await fetchParticipants(raid.id);
      const participantText = buildParticipantText(participants);
      const raidTime = new Date(raid.raid_datetime).toLocaleString("ko-KR");

      const { ok, error } = await sendDiscordMessage({
        content: "⚠️ **레이드 10분 전**입니다! 미리 집결해주세요.",
        embeds: [
          {
            title: raid.raid_name ?? "레이드 알림",
            color: 0xff6600,
            fields: [
              { name: "🕐 시작 시간", value: raidTime, inline: true },
              { name: "👥 총 참가자", value: `${participants.length}명`, inline: true },
              { name: "📋 최종 명단", value: participantText },
            ],
            footer: { text: "10분 전 알림" },
          },
        ],
      });

      if (!ok) {
        errors.push({ step: "ten_min_discord", raidId: raid.id, error: error ?? "" });
        continue;
      }

      const { error: updateError } = await supabase
        .from("raid_schedules")
        .update({ ten_min_reminded: true })
        .eq("id", raid.id);

      if (updateError) {
        errors.push({ step: "ten_min_update", raidId: raid.id, error: updateError.message });
        continue;
      }

      tenMinSentCount++;
    }

    // ── 종료 후 완료 알림 ────────────────────────────────
    for (const raid of completedRaids ?? []) {
      const participants = await fetchParticipants(raid.id);
      const raidTime = new Date(raid.raid_datetime).toLocaleString("ko-KR");

      const { ok, error } = await sendDiscordMessage({
        content: "✅ **레이드가 종료**됐습니다. 수고하셨습니다!",
        embeds: [
          {
            title: raid.raid_name ?? "레이드 종료",
            color: 0x57f287,
            fields: [
              { name: "🕐 진행 시간", value: raidTime, inline: true },
              { name: "👥 참여 인원", value: `${participants.length}명`, inline: true },
              { name: "📋 참가자 명단", value: buildParticipantText(participants) },
            ],
            footer: { text: "레이드 종료 알림" },
          },
        ],
      });

      if (!ok) {
        errors.push({ step: "completed_discord", raidId: raid.id, error: error ?? "" });
        continue;
      }

      const { error: updateError } = await supabase
        .from("raid_schedules")
        .update({ completed: true })
        .eq("id", raid.id);

      if (updateError) {
        errors.push({ step: "completed_update", raidId: raid.id, error: updateError.message });
        continue;
      }

      completedSentCount++;
    }

    // ── 응답 ─────────────────────────────────────────────
    return res.status(200).json({
      ok: errors.length === 0,
      oneHourCount:   oneHourSentCount,
      tenMinCount:    tenMinSentCount,
      completedCount: completedSentCount,
      ...(errors.length > 0 && { errors }),
      debug: {
        now:           now.toISOString(),
        oneHourFrom,  oneHourTo,
        tenMinFrom,   tenMinTo,
        completedFrom, completedTo,
      },
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      step: "catch",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
