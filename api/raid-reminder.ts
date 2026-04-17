import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const vercelUrl = process.env.VERCEL_URL;

if (!supabaseUrl) {
  throw new Error("Missing VITE_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

export default async function handler(req, res) {
  try {
    const now = new Date();

    const from = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
    const to = new Date(now.getTime() + 61 * 60 * 1000).toISOString();

    const { data: raids, error } = await supabase
      .from("raid_schedules")
      .select("*")
      .eq("one_hour_reminded", false)
      .not("raid_datetime", "is", null)
      .gte("raid_datetime", from)
      .lt("raid_datetime", to);

    const { data: latestRaids, error: latestError } = await supabase
      .from("raid_schedules")
      .select("id, raid_name, raid_date, raid_time, raid_datetime, one_hour_reminded")
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      return res.status(500).json({
        ok: false,
        step: "supabase_select",
        error: error.message,
      });
    }

    if (latestError) {
      return res.status(500).json({
        ok: false,
        step: "supabase_latest_select",
        error: latestError.message,
      });
    }

    if (!raids || raids.length === 0) {
      return res.status(200).json({
        ok: true,
        count: 0,
        debug: {
          now: now.toISOString(),
          from,
          to,
          latestRaids,
        },
      });
    }

    const baseUrl =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : vercelUrl
        ? `https://${vercelUrl}`
        : null;

    if (!baseUrl) {
      return res.status(500).json({
        ok: false,
        step: "base_url",
        error: "Missing VERCEL_URL",
      });
    }

    let sentCount = 0;

    for (const raid of raids) {
      const discordResponse = await fetch("/api/discord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "⏰ 레이드 1시간 전입니다!",
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
          step: "discord_send",
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
          step: "supabase_update",
          raidId: raid.id,
          error: updateError.message,
        });
      }

      sentCount += 1;
    }

    return res.status(200).json({
      ok: true,
      count: sentCount,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      step: "catch",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
