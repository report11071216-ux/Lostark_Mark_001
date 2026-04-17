import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ service role key 필요
);

export default async function handler(req, res) {
  try {
    const now = new Date();

    // 55분 ~ 60분 후 범위
    const from = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
    const to = new Date(now.getTime() + 61 * 60 * 1000).toISOString();

    // 대상 레이드 조회
    const { data: raids, error } = await supabase
      .from("raid_schedules")
      .select("*")
      .eq("one_hour_reminded", false)
      .gte("raid_time", from)
      .lt("raid_time", to);

    if (error) {
      return res.status(500).json({ ok: false, error });
    }

    for (const raid of raids) {
      // 디코 알림 보내기
      await fetch(`${process.env.VERCEL_URL}/api/discord`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "⏰ 레이드 1시간 전입니다!",
          embeds: [
            {
              title: raid.title,
              description: `시작 시간: ${new Date(raid.raid_time).toLocaleString()}`,
              color: 0xffcc00,
            },
          ],
        }),
      });

      // 알림 완료 처리
      await supabase
        .from("raid_schedules")
        .update({ one_hour_reminded: true })
        .eq("id", raid.id);
    }

    return res.status(200).json({
      ok: true,
      count: raids.length,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
