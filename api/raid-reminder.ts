import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

if (!discordWebhookUrl) {
  throw new Error("Missing DISCORD_WEBHOOK_URL");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req, res) {
  try {
    const now = new Date();

    // 1시간 전 범위
    const oneHourFrom = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
    const oneHourTo = new Date(now.getTime() + 61 * 60 * 1000).toISOString();

    // 10분 전 범위
    const tenMinFrom = new Date(now.getTime() + 9 * 60 * 1000).toISOString();
    const tenMinTo = new Date(now.getTime() + 11 * 60 * 1000).toISOString();

    // 1시간 전 대상
    const { data: oneHourRaids, error: oneHourError } = await supabase
      .from("raid_schedules")
      .select("*")
      .eq("one_hour_reminded", false)
      .not("raid_datetime", "is", null)
      .gte("raid_datetime", oneHourFrom)
      .lt("raid_datetime", oneHourTo);

    if (oneHourError) {
      return res.status(500).json({
        ok: false,
        step: "one_hour_select",
        error: oneHourError.message,
      });
    }

    // 10분 전 대상
    const { data: tenMinRaids, error: tenMinError } = await supabase
      .from("raid_schedules")
      .select("*")
      .eq("ten_min_reminded", false)
      .not("raid_datetime", "is", null)
      .gte("raid_datetime", tenMinFrom)
      .lt("raid_datetime", tenMinTo);

    if (tenMinError) {
      return res.status(500).json({
        ok: false,
        step: "ten_min_select",
        error: tenMinError.message,
      });
    }

    let oneHourSentCount = 0;
    let tenMinSentCount = 0;

    // 1시간 전 알림
    for (const raid of oneHourRaids ?? []) {
      const discordResponse = await fetch(discordWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "⏰ 레이드 1시간 전입니다!",
          embeds: [
            {
              title: raid.raid_name ?? "레이드 알림",
              description: `시작 시간: ${new Date(raid.raid_datetime).toLocaleString("ko-KR")}`,
              color: 0xffcc00,
            },
          ],
        }),
      });

      if (!discordResponse.ok) {
        const errorText = await discordResponse.text();

        return res.status(500).json({
          ok: false,
          step: "one_hour_discord_send",
          raidId: raid.id,
          error: errorText,
        });
      }

      const { error: updateError } = await supabase
        .from("raid_schedules")
        .update({ one_hour_reminded: true })
        .eq("id", raid.id);

      if (updateError) {
        return res.status(500).json({
          ok: false,
          step: "one_hour_update",
          raidId: raid.id,
          error: updateError.message,
        });
      }

      oneHourSentCount += 1;
    }

    // 10분 전 알림
    for (const raid of tenMinRaids ?? []) {
      const discordResponse = await fetch(discordWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: "⚠️ 레이드 10분 전입니다! 미리 집결해주세요.",
          embeds: [
            {
              title: raid.raid_name ?? "레이드 알림",
              description: `시작 시간: ${new Date(raid.raid_datetime).toLocaleString("ko-KR")}`,
              color: 0xff6600,
            },
          ],
        }),
      });

      if (!discordResponse.ok) {
        const errorText = await discordResponse.text();

        return res.status(500).json({
          ok: false,
          step: "ten_min_discord_send",
          raidId: raid.id,
          error: errorText,
        });
      }

      const { error: updateError } = await supabase
        .from("raid_schedules")
        .update({ ten_min_reminded: true })
        .eq("id", raid.id);

      if (updateError) {
        return res.status(500).json({
          ok: false,
          step: "ten_min_update",
          raidId: raid.id,
          error: updateError.message,
        });
      }

      tenMinSentCount += 1;
    }

    return res.status(200).json({
      ok: true,
      oneHourCount: oneHourSentCount,
      tenMinCount: tenMinSentCount,
      debug: {
        now: now.toISOString(),
        oneHourFrom,
        oneHourTo,
        tenMinFrom,
        tenMinTo,
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
